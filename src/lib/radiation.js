// Basic radiation helpers
const sigma = 5.670374419e-8; // W/m2K4

export function blackbody({ T, A }) {
  // T in K
  return { Q: sigma * A * Math.pow(T, 4) };
}

export function graybody({ T, A, epsilon, T_surroundings = 0 }) {
  // T, T_surroundings in K
  const Q = epsilon * sigma * A * (Math.pow(T, 4) - Math.pow(T_surroundings, 4));
  return { Q };
}

// Two diffuse gray surfaces exchange (simple form using reciprocity and view factor F12)
// Returns net heat from surface1 to surface2
export function twoSurfaceExchange({ T1, A1, eps1, T2, A2, eps2, F12 = 1.0 }) {
  // convert to K if needed (caller should pass K)
  // Solve radiative network with resistances
  const R1 = (1 - eps1) / (eps1 * A1);
  const R2 = (1 - eps2) / (eps2 * A2);
  const Rf = 1 / (A1 * F12);
  const effective = (1 / (A1 * eps1)) + Rf + (1 / (A2 * eps2));
  const E1 = Math.pow(T1, 4);
  const E2 = Math.pow(T2, 4);
  // common approach: Q = sigma / ( (1/(eps1*A1)) + (1/(A1*F12)) + (1/(eps2*A2)) ) * (T1^4 - T2^4)
  const denom = (1 / (eps1 * A1)) + (1 / (A1 * F12)) + (1 / (eps2 * A2));
  const Q = sigma * (E1 - E2) / denom;
  return { Q };
}

export default { blackbody, graybody, twoSurfaceExchange };
