// Basic radiation helpers. All temperatures in K, areas in m², Q in W.
export const SIGMA = 5.670374419e-8; // W/(m²·K⁴)

export function celsiusToKelvin(tC) {
  return Number(tC) + 273.15;
}

function checkEmissivity(eps, name) {
  if (!(eps > 0 && eps <= 1)) throw new Error(`${name} 0 < ε ≤ 1 aralığında olmalıdır.`);
}

export function blackbody({ T, A }) {
  return { Q: SIGMA * A * Math.pow(T, 4) };
}

// Small gray body in large surroundings
export function graybody({ T, A, epsilon, T_surroundings = 0 }) {
  checkEmissivity(epsilon, 'Yayıcılık');
  const Q = epsilon * SIGMA * A * (Math.pow(T, 4) - Math.pow(T_surroundings, 4));
  return { Q };
}

// Net exchange between two diffuse gray surfaces forming an enclosure (radiation network):
//   Q12 = σ (T1⁴ − T2⁴) / [ (1−ε1)/(ε1·A1) + 1/(A1·F12) + (1−ε2)/(ε2·A2) ]
// Returns net heat from surface 1 to surface 2.
export function twoSurfaceExchange({ T1, A1, eps1, T2, A2, eps2, F12 = 1.0 }) {
  checkEmissivity(eps1, 'Yüzey 1 yayıcılığı');
  checkEmissivity(eps2, 'Yüzey 2 yayıcılığı');
  if (!(F12 > 0 && F12 <= 1)) throw new Error('Görüş faktörü F12 0 < F12 ≤ 1 aralığında olmalıdır.');
  if (!(A1 > 0) || !(A2 > 0)) throw new Error('Yüzey alanları pozitif olmalıdır.');
  const resistance = (1 - eps1) / (eps1 * A1) + 1 / (A1 * F12) + (1 - eps2) / (eps2 * A2);
  const Q = (SIGMA * (Math.pow(T1, 4) - Math.pow(T2, 4))) / resistance;
  return { Q };
}

export default { blackbody, graybody, twoSurfaceExchange, celsiusToKelvin, SIGMA };
