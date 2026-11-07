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
