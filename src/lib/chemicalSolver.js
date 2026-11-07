// Pure solver utilities for testing and reuse
//
// Reaction: a A + b B <=> c C + d D, concentration-based K = [C]^c [D]^d / ([A]^a [B]^b).
// The extent ξ may be negative (reaction proceeds in reverse when the initial mixture
// already holds more products than equilibrium allows).

const R = 8.314462618; // J/(mol K)

export function equilibriumSolve(inputs) {
  const num = v => Number(v) || 0;
  const [coefA, coefB, coefC, coefD] = ['coefA', 'coefB', 'coefC', 'coefD'].map(key => num(inputs[key]));
  const [concA, concB, concC, concD] = ['concA', 'concB', 'concC', 'concD'].map(key => num(inputs[key]));
  const K = Number(inputs.equilibriumConstant);
  if (!isFinite(K) || K <= 0) throw new Error('Denge sabiti K pozitif olmalıdır.');
  if (coefA + coefB <= 0 || coefC + coefD <= 0) throw new Error('En az bir reaktan ve bir ürün katsayısı pozitif olmalıdır.');

  const concentrationsAt = x => ({
    A: concA - coefA * x,
    B: concB - coefB * x,
    C: concC + coefC * x,
    D: concD + coefD * x,
  });

  // ln Q(ξ) - ln K is strictly increasing in ξ
  function g(x) {
    const { A, B, C, D } = concentrationsAt(x);
    let lnQ = 0;
    if (coefC > 0) lnQ += coefC * Math.log(C);
    if (coefD > 0) lnQ += coefD * Math.log(D);
    if (coefA > 0) lnQ -= coefA * Math.log(A);
    if (coefB > 0) lnQ -= coefB * Math.log(B);
    return lnQ - Math.log(K);
  }

  // Physical extent limits: no concentration may become negative
  const upper = [];
  if (coefA > 0) upper.push(concA / coefA);
  if (coefB > 0) upper.push(concB / coefB);
  const lower = [];
  if (coefC > 0) lower.push(-concC / coefC);
  if (coefD > 0) lower.push(-concD / coefD);
  const maxExtent = Math.min(...upper);
  const minExtent = Math.max(...lower);
  if (!(maxExtent > minExtent)) throw new Error('Başlangıç konsantrasyonları dengeye izin vermiyor (tüm türler sıfır olamaz).');

  // Bisection on the open interval (minExtent, maxExtent). g -> -∞ at minExtent, +∞ at maxExtent.
  let lo = minExtent;
  let hi = maxExtent;
  let x = 0.5 * (lo + hi);
  for (let i = 0; i < 300; i++) {
    x = 0.5 * (lo + hi);
    const gx = g(x);
    if (gx === 0 || hi - lo < 1e-14 * Math.max(1, Math.abs(x))) break;
    if (gx > 0 || Number.isNaN(gx)) hi = x; else lo = x;
  }

  const { A: eqA, B: eqB, C: eqC, D: eqD } = concentrationsAt(x);
  const Kcalc = Math.exp(g(x) + Math.log(K));
  return { eqA, eqB, eqC, eqD, x, Kcalc, maxExtent, minExtent };
}

// Temperature at which the reaction has equilibrium constant K, from
// ln K = -ΔH°/(R T) + ΔS°/R  (ΔH°, ΔS° assumed temperature independent)
//   =>  T = ΔH° / (ΔS° - R ln K)
export function solveTemperature(inputs) {
  const { deltaH0, deltaS0, equilibriumConstant: K } = inputs;
  if (!K || K <= 0) throw new Error('Geçersiz K');
  const dH = Number(deltaH0) * 1000; // kJ/mol -> J/mol
  const dS = Number(deltaS0); // J/(mol K)
  const denom = dS - R * Math.log(Number(K));
  if (!isFinite(dH) || !isFinite(denom) || Math.abs(denom) < 1e-12) {
    throw new Error('Sıcaklık çözülemedi: ΔS° − R·ln K sıfır.');
  }
  const T = dH / denom;
  if (!isFinite(T) || T <= 0) {
    throw new Error('Bu ΔH°, ΔS° ve K değerleri için pozitif bir sıcaklık çözümü yok.');
  }
  return T;
}
