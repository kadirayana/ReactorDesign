// Counter-current heat exchanger: duty from LMTD and axial temperature profiles.
// Temperatures in °C, U in W/(m²·K), A in m²  =>  Q in W.
//
// x = 0 is the hot-fluid inlet end (where the cold fluid leaves), x = 1 the hot outlet end.
// With constant U and heat capacities the local ΔT varies exponentially along the area:
//   ΔT(x) = ΔT1 · r^x,  r = ΔT2 / ΔT1,
// and the fraction of the duty transferred up to x is f(x) = (1 - r^x) / (1 - r).

function linspace(n) {
  const arr = [];
  for (let i = 0; i <= n; i++) arr.push(i / n);
  return arr;
}

export function calculateHeatTransfer({ U = 500, A = 10, Th_in = 150, Th_out = 100, Tc_in = 30, Tc_out = 80, points = 50 } = {}) {
  const deltaT1 = Th_in - Tc_out; // hot inlet end
  const deltaT2 = Th_out - Tc_in; // hot outlet end

  if (!(deltaT1 > 0) || !(deltaT2 > 0)) {
    return {
      error: `Sıcaklık kesişimi: ΔT1 = ${deltaT1.toFixed(2)} °C, ΔT2 = ${deltaT2.toFixed(2)} °C. Ters akışlı değiştiricide her iki uç farkı da pozitif olmalıdır.`,
      Q: NaN,
      LMTD: NaN,
      deltaT1,
      deltaT2,
      profiles: { x: [], Th: [], Tc: [], dT: [] },
    };
  }

  const r = deltaT2 / deltaT1;
  const equalEnds = Math.abs(r - 1) < 1e-9;
  const LMTD = equalEnds ? deltaT1 : (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  const Q = U * A * LMTD;

  const xs = linspace(points);
  const frac = x => (equalEnds ? x : (1 - Math.pow(r, x)) / (1 - r));
  const Th = xs.map(x => Th_in - (Th_in - Th_out) * frac(x));
  const Tc = xs.map(x => Tc_out - (Tc_out - Tc_in) * frac(x));
  const dT = Th.map((t, i) => t - Tc[i]);

  return {
    error: null,
    Q,
    LMTD,
    deltaT1,
    deltaT2,
    profiles: { x: xs, Th, Tc, dT },
  };
}

export default calculateHeatTransfer;

/**
 * Steady 1-D conduction without generation.
 * geometry: 'wall' { L, k, A } | 'cylinder' { r1, r2, L, k } | 'sphere' { r1, r2, k }
 * T1 at x = 0 / r = r1, T2 at x = L / r = r2 (°C or K, same unit).
 * Returns heat rate Q [W], thermal resistance R [K/W] and the temperature profile.
 */
export function conduction({ geometry = 'wall', T1, T2, k, A, L, r1, r2, points = 40 }) {
  const pos = v => Number.isFinite(Number(v)) && Number(v) > 0;
  if (!pos(k)) throw new Error('Isıl iletkenlik k pozitif olmalıdır.');
  let R;
  let profile;
  if (geometry === 'wall') {
    if (!pos(L) || !pos(A)) throw new Error('Kalınlık ve alan pozitif olmalıdır.');
    R = L / (k * A);
    profile = Array.from({ length: points + 1 }, (_, i) => {
      const x = (i / points) * L;
      return { x, T: T1 + (T2 - T1) * (x / L) };
    });
  } else if (geometry === 'cylinder') {
    if (!pos(r1) || !pos(r2) || !pos(L) || !(r2 > r1)) throw new Error('0 < r₁ < r₂ ve L > 0 olmalıdır.');
    R = Math.log(r2 / r1) / (2 * Math.PI * k * L);
    profile = Array.from({ length: points + 1 }, (_, i) => {
      const r = r1 + (i / points) * (r2 - r1);
      return { x: r, T: T1 + (T2 - T1) * (Math.log(r / r1) / Math.log(r2 / r1)) };
    });
  } else if (geometry === 'sphere') {
    if (!pos(r1) || !pos(r2) || !(r2 > r1)) throw new Error('0 < r₁ < r₂ olmalıdır.');
    R = (1 / r1 - 1 / r2) / (4 * Math.PI * k);
    profile = Array.from({ length: points + 1 }, (_, i) => {
      const r = r1 + (i / points) * (r2 - r1);
      return { x: r, T: T1 + (T2 - T1) * ((1 / r1 - 1 / r) / (1 / r1 - 1 / r2)) };
    });
  } else {
    throw new Error(`Bilinmeyen geometri: ${geometry}`);
  }
  return { Q: (T1 - T2) / R, R, profile };
}

/**
 * Effectiveness–NTU for a counter-current exchanger.
 * Ch, Cc: heat capacity rates [W/K]; returns duty and outlet temperatures.
 */
export function effectivenessNTU({ U, A, Ch, Cc, Th_in, Tc_in }) {
  if (!(U > 0) || !(A > 0) || !(Ch > 0) || !(Cc > 0)) throw new Error('U, A ve ısıl kapasite debileri pozitif olmalıdır.');
  if (!(Th_in > Tc_in)) throw new Error('Sıcak akışkan girişi soğuk akışkan girişinden sıcak olmalıdır.');
  const Cmin = Math.min(Ch, Cc);
  const Cmax = Math.max(Ch, Cc);
  const Cr = Cmin / Cmax;
  const NTU = (U * A) / Cmin;
  const eps = Math.abs(1 - Cr) < 1e-9
    ? NTU / (1 + NTU)
    : (1 - Math.exp(-NTU * (1 - Cr))) / (1 - Cr * Math.exp(-NTU * (1 - Cr)));
  const Q = eps * Cmin * (Th_in - Tc_in);
  return { NTU, Cr, eps, Q, Th_out: Th_in - Q / Ch, Tc_out: Tc_in + Q / Cc };
}
