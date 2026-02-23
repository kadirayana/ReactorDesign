function computeVaporizer(inputs) {
  const {
    feedFlow, vaporFraction, T_feed_in, T_feed_out, P_operating,
    Pc_mix, dHvap_mix, Cp_mix, T_water_in, T_water_out, k_water, Cp_water, rho_water, mu_water,
    tubeLength, d0, di, Rf_o, Rf_i, k_tube, U_initial, freeboard, iterations
  } = inputs;

  // Step 1: Heat load
  const moles_vapor = vaporFraction * feedFlow;
  const deltaT_feed = T_feed_out - T_feed_in;
  // The entire feed is heated to the saturation point
  const Q1 = feedFlow * Cp_mix * deltaT_feed;
  // The vapor fraction is vaporized
  const Q2 = moles_vapor * dHvap_mix;
  const Q_total_kJ_h = Q1 + Q2;
  const Q_total_kW = Q_total_kJ_h / 3600;
  const Q_total_W = Q_total_kW * 1000;
  // Step 2: Cooling water mass flow
  const deltaT_water = T_water_in - T_water_out;
  const m_water = deltaT_water > 0 ? Q_total_kW / (Cp_water * deltaT_water) : 0;

  // LMTD
  const deltaT1 = Math.abs(T_water_in - T_feed_out);
  const deltaT2 = Math.abs(T_water_out - T_feed_in);
  let LMTD = 0;
  if (Math.abs(deltaT1 - deltaT2) < 1e-6) {
    LMTD = (deltaT1 + deltaT2) / 2;
  } else {
    LMTD = (deltaT1 - deltaT2) / Math.log((Math.max(deltaT1, 1e-6)) / (Math.max(deltaT2, 1e-6)));
  }

  const iterationResults = [];
  let U_current = U_initial;
  const A_tube = Math.PI * d0 * tubeLength;
  let lastResult = {};
  for (let i = 0; i < iterations; i++) {
    const A_current = Q_total_W / (U_current * LMTD);
    const N_tubes_current = A_current / A_tube;
    const area_inner = Math.PI * Math.pow(di, 2) / 4;
    const v_water_current = m_water / (rho_water * N_tubes_current * area_inner);
    const Re_current = (rho_water * v_water_current * di) / mu_water;
    const Pr = ((Cp_water * 1000) * mu_water) / k_water;
    const Nu_current = 0.024 * Math.pow(Re_current, 0.8) * Math.pow(Pr, 1 / 3);
    const h_i_current = (Nu_current * k_water) / di;
    const P_reduced = P_operating / Pc_mix;
    const q_flux_current = Q_total_W / A_current;
    const h_nb_current = 0.104 * Math.pow(Pc_mix, 0.69) * Math.pow(q_flux_current, 0.7) *
      (1.8 * Math.pow(P_reduced, 0.17) + 4 * Math.pow(P_reduced, 1.2) + 10 * Math.pow(P_reduced, 10));
    const R_tube_wall = (d0 / (2 * k_tube)) * Math.log(d0 / di);
    const R_water_side_current = (d0 / di) * (1 / h_i_current);
    const R_fouling = Rf_o + (d0 / di) * Rf_i;
    const R_vapor = 1 / h_nb_current;
    const R_total_current = R_vapor + R_tube_wall + R_water_side_current + R_fouling;
    const U_calc_current = 1 / R_total_current;
    iterationResults.push({
      iteration: i + 1,
      U: U_current,
      A: A_current,
      N_tubes: N_tubes_current,
      v_water: v_water_current,
      Re: Re_current,
      h_i: h_i_current,
      h_nb: h_nb_current,
      U_calc: U_calc_current
    });
    U_current = U_calc_current;
    lastResult = iterationResults[iterationResults.length - 1];
  }

  const Db = d0 * Math.pow(Math.pow(lastResult.N_tubes, 0.249), 1 / 2.207);
  const Ds = 2 * Db;
  const freeboard_ratio = freeboard / Ds;

  // compute hexagonal packing positions and how many tubes can fit inside shell
  function genHexPositions(limit) {
    const pos = [];
    pos.push([0, 0]);
    let ring = 0;
    while (pos.length < limit) {
      ring++;
      for (let q = -ring; q <= ring; q++) {
        for (let r = Math.max(-ring, -q - ring); r <= Math.min(ring, -q + ring); r++) {
          const x = q + r / 2;
          const y = (Math.sqrt(3) / 2) * r;
          pos.push([x, y]);
          if (pos.length >= limit) break;
        }
        if (pos.length >= limit) break;
      }
    }
    return pos.slice(0, limit);
  }

  // determine how many tubes physically fit in shell based on pitch
  const shellRadius = Ds / 2;
  const pitch = 1.25 * d0; // typical pitch = 1.25 * tube outer diameter
  const clearance = Math.max(0.01, 0.02 * d0); // safety clearance inside shell
  const usableRadius = Math.max(0, shellRadius - clearance);

  // generate more positions than needed and then filter by usable radius
  const candidate = genHexPositions(Math.max(1000, Math.ceil(lastResult.N_tubes * 2)));
  const packedPositions = candidate.filter(([nx, ny]) => {
    const x = nx * pitch;
    const y = ny * pitch;
    return Math.sqrt(x * x + y * y) + (d0 / 2) <= usableRadius;
  }).map(([nx, ny]) => [nx * pitch, ny * pitch]);

  const packableCount = packedPositions.length;
  const neededN = Math.max(1, Math.round(lastResult.N_tubes));
  const finalN = Math.min(neededN, packableCount);

  // if we cannot place all required tubes, we'll use the packed subset
  const finalPositions = packedPositions.slice(0, finalN);

  const warning = neededN > packableCount ? `Requested ${neededN} tubes but only ${packableCount} fit in Ds=${(Ds).toFixed(3)} m. Consider larger shell or different pitch.` : null;

  return { Q_total_kJ_h, Q_total_kW, m_water, LMTD, iterationResults, Db, Ds, freeboard_ratio, packedPositions: finalPositions, packedCount: finalPositions.length, packWarning: warning };
}

module.exports = { computeVaporizer };
