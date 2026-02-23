// Calculation utilities for the customizable reactor page
export function calculateReactorss(inputs) {
  const {
    prodName, prodMolarMass, prodStoich,
    reactAName, reactAStoich, reactBName, reactBStoich,
    conversion, annualProd, opHours, reactionTemp, P_total,
    k0, E, orderLim, orderExc, feedRatio, limiting
  } = inputs;

  // annual production ton -> kg -> kmol/year
  const annualProdKg = annualProd * 1000;
  const prodKmolYear = annualProdKg / prodMolarMass;
  const prodKmolH = prodKmolYear / opHours;

  // Limiting feed flow (kmol/h)
  let F0_lim;
  if (limiting === 'A') F0_lim = (prodKmolH * (reactAStoich / prodStoich)) / conversion;
  else F0_lim = (prodKmolH * (reactBStoich / prodStoich)) / conversion;
  const F0_exc = F0_lim * feedRatio;

  // Arrhenius (convert E to J/mol)
  const R = 8.314; // J/(mol K)
  // Heuristic: UI expects E in kJ/mol. If the user passed a very large number (>1e4),
  // assume it's already in J/mol (e.g., 63200 means 63200 J/mol). Otherwise multiply by 1000.
  const E_num = Number(E);
  const E_j = E_num > 1e4 ? E_num : E_num * 1000;
  // compute Arrhenius k here so reactionRate can use k_h
  const k_val = k0 * Math.exp(-E_j / (R * reactionTemp));
  const k_h = k_val * 3600;

  function pressuresA_lim(X) {
    const molesA = 1 - X;
    const molesB = feedRatio - (reactBStoich / reactAStoich) * X;
    const totalMoles = (1 + feedRatio) - X * (1 + (reactBStoich / reactAStoich));
    return { PA: P_total * (molesA / totalMoles), PB: P_total * (molesB / totalMoles) };
  }

  function pressuresB_lim(X) {
    const molesB = 1 - X;
    const molesA = feedRatio - (reactAStoich / reactBStoich) * X;
    const totalMoles = (1 + feedRatio) - X * (1 + (reactAStoich / reactBStoich));
    return { PA: P_total * (molesA / totalMoles), PB: P_total * (molesB / totalMoles) };
  }

  function reactionRate(X) {
    let P_lim, P_ex;
    if (limiting === 'A') {
      const pressures = pressuresA_lim(X);
      P_lim = Math.max(1e-6, pressures.PA); P_ex = Math.max(1e-6, pressures.PB);
    } else {
      const pressures = pressuresB_lim(X);
      P_lim = Math.max(1e-6, pressures.PB); P_ex = Math.max(1e-6, pressures.PA);
    }
    const rate = k_h * Math.pow(P_lim, orderLim) * Math.pow(P_ex, orderExc);
    return Math.max(1e-12, rate || 1e-12);
  }

  // Integration (trapezoidal) and profiles
  const N = 200;
  const dX = conversion / N;
  let integral = 0;
  const Xpoints = [];
  const rpoints = [];
  const concLim = [];
  const concExc = [];
  const concLim_kmolh = [];
  const concExc_kmolh = [];

  for (let i = 0; i <= N; i++) {
    const X_val = i * dX;
    const r_val = reactionRate(X_val) || 1e-12;
    const f = F0_lim / r_val;

    // partial pressures and mole fractions
    let PA = 0, PB = 0;
    if (limiting === 'A') {
      const p = pressuresA_lim(X_val); PA = p.PA; PB = p.PB;
    } else {
      const p = pressuresB_lim(X_val); PA = p.PA; PB = p.PB;
    }
    const xA = PA / P_total; const xB = PB / P_total;

    // approximate species mol flows (kmol/h)
    const nA = Math.max(0, F0_lim * (1 - X_val));
    const nB = Math.max(0, F0_exc - (reactBStoich / reactAStoich) * F0_lim * X_val);

    Xpoints.push(X_val);
    rpoints.push(r_val);
    concLim.push(xA);
    concExc.push(xB);
    concLim_kmolh.push(nA);
    concExc_kmolh.push(nB);

    if (i === 0 || i === N) integral += f; else integral += 2 * f;
  }
  integral = (dX / 2) * integral;
  const W = integral;

  // compute r min/max for diagnostics
  const rMin = Math.min(...rpoints);
  const rMax = Math.max(...rpoints);
  const warning = W > 5000 ? 'Calculated W is very large (>5,000 kg). Check k0 units/magnitude and E (kJ/mol).' : null;

  return {
    prodName,
    prodKmolH,
    F0_lim,
    F0_exc,
    W,
    Xpoints,
    rpoints,
    concLim,
    concExc,
    concLim_kmolh,
    concExc_kmolh,
    // diagnostics
    _diag: { rMin, rMax, integral, k_val, k_h, warning }
  };
}
