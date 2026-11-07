// Incompressible pipe flow, pump sizing and NPSH.
// SI units throughout: Q [m³/s], D [m], L [m], ρ [kg/m³], μ [Pa·s], ε [m], P [Pa], H [m].

export const G = 9.81;

export const FLUIDS = {
  water20: { label: 'Su, 20 °C', rho: 998.2, mu: 1.002e-3, pv: 2339 },
  water60: { label: 'Su, 60 °C', rho: 983.2, mu: 4.67e-4, pv: 19940 },
  water90: { label: 'Su, 90 °C', rho: 965.3, mu: 3.15e-4, pv: 70180 },
  ethanol: { label: 'Etanol, 20 °C', rho: 789, mu: 1.2e-3, pv: 5950 },
  oil: { label: 'Hafif yağ, 20 °C', rho: 870, mu: 3.0e-2, pv: 100 },
  glycol: { label: 'Etilen glikol, 20 °C', rho: 1113, mu: 1.61e-2, pv: 7 },
};

export const ROUGHNESS = {
  commercialSteel: { label: 'Ticari çelik', eps: 0.045e-3 },
  stainless: { label: 'Paslanmaz çelik / çekme boru', eps: 0.0015e-3 },
  galvanized: { label: 'Galvanizli çelik', eps: 0.15e-3 },
  castIron: { label: 'Dökme demir', eps: 0.26e-3 },
  pvc: { label: 'PVC / plastik', eps: 0.0015e-3 },
  concrete: { label: 'Beton', eps: 1.0e-3 },
};

// Loss coefficients K (Crane / typical textbook values)
export const FITTINGS = {
  elbow90: { label: '90° dirsek (standart)', K: 0.75 },
  elbow45: { label: '45° dirsek', K: 0.4 },
  teeBranch: { label: 'T – yan çıkış', K: 1.0 },
  gateValve: { label: 'Sürgülü vana (açık)', K: 0.17 },
  globeValve: { label: 'Glob vana (açık)', K: 6.0 },
  checkValve: { label: 'Çek valf (salınımlı)', K: 2.0 },
  entrance: { label: 'Keskin kenarlı giriş', K: 0.5 },
  exit: { label: 'Çıkış (tanka boşalma)', K: 1.0 },
};

/**
 * Darcy friction factor.
 * Laminar (Re < 2300): 64/Re. Otherwise Colebrook–White, solved by fixed-point
 * iteration starting from Swamee–Jain.
 */
export function frictionFactor(Re, relRough) {
  if (!(Re > 0)) throw new Error('Reynolds sayısı pozitif olmalıdır.');
  if (Re < 2300) return { f: 64 / Re, regime: 'laminar' };
  let f = 0.25 / Math.pow(Math.log10(relRough / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2); // Swamee–Jain
  for (let i = 0; i < 50; i++) {
    const next = Math.pow(-2 * Math.log10(relRough / 3.7 + 2.51 / (Re * Math.sqrt(f))), -2);
    if (Math.abs(next - f) < 1e-12) { f = next; break; }
    f = next;
  }
  return { f, regime: Re < 4000 ? 'transition' : 'turbulent' };
}

/** Head loss in a straight pipe plus fittings. */
export function pipeLoss({ Q, D, L, eps, rho, mu, sumK = 0 }) {
  if (!(D > 0) || !(L >= 0)) throw new Error('Çap pozitif, uzunluk negatif olmamalıdır.');
  const A = (Math.PI * D * D) / 4;
  const V = Q / A;
  if (V === 0) return { V: 0, Re: 0, f: 0, regime: 'none', hf: 0, hm: 0, hTotal: 0, dP: 0, velocityHead: 0 };
  const Re = (rho * Math.abs(V) * D) / mu;
  const { f, regime } = frictionFactor(Re, eps / D);
  const velocityHead = (V * V) / (2 * G);
  const hf = f * (L / D) * velocityHead;
  const hm = sumK * velocityHead;
  return { V, Re, f, regime, hf, hm, hTotal: hf + hm, dP: rho * G * (hf + hm), velocityHead };
}

/**
 * Pump requirement for a single-diameter line.
 * Δz = z_discharge − z_suction-surface, ΔP = P_discharge − P_suction-surface.
 * NPSHa = (P_s − P_v)/(ρg) + z_s − h_loss,suction, where z_s is the liquid level
 * above the pump centreline (negative for suction lift).
 */
export function pumpSystem({
  Q, D, L, eps, rho, mu, pv, sumK = 0,
  dz = 0, dP = 0, efficiency = 0.7,
  Ps = 101325, zs = 0, Ls = 0, sumKs = 0,
  npshr = null, pumpH0 = null, pumpQmax = null,
}) {
  if (!(Q > 0)) throw new Error('Debi pozitif olmalıdır.');
  if (!(efficiency > 0 && efficiency <= 1)) throw new Error('Pompa verimi 0 ile 1 arasında olmalıdır.');
  const line = pipeLoss({ Q, D, L, eps, rho, mu, sumK });
  const staticHead = dz + dP / (rho * G);
  const H = staticHead + line.hTotal;
  const hydraulicPower = rho * G * Q * H;
  const shaftPower = hydraulicPower / efficiency;

  const suction = pipeLoss({ Q, D, L: Ls, eps, rho, mu, sumK: sumKs });
  const npsha = (Ps - pv) / (rho * G) + zs - suction.hTotal;

  // System curve and optional quadratic pump curve H = H0·(1 − (Q/Qmax)²)
  const Qmax = Math.max(Q * 1.6, pumpQmax || 0);
  const curve = Array.from({ length: 41 }, (_, i) => {
    const q = (i / 40) * Qmax;
    const h = q === 0 ? staticHead : staticHead + pipeLoss({ Q: q, D, L, eps, rho, mu, sumK }).hTotal;
    const hp = pumpH0 && pumpQmax ? pumpH0 * (1 - Math.pow(q / pumpQmax, 2)) : null;
    return { Q: q, system: h, pump: hp };
  });

  let operating = null;
  if (pumpH0 > 0 && pumpQmax > 0) {
    // Solve pump(Q) = system(Q) by bisection on [0, pumpQmax]
    const diff = q => pumpH0 * (1 - Math.pow(q / pumpQmax, 2)) - (q === 0 ? staticHead : staticHead + pipeLoss({ Q: q, D, L, eps, rho, mu, sumK }).hTotal);
    if (diff(0) > 0) {
      let lo = 0;
      let hi = pumpQmax;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (diff(mid) > 0) lo = mid; else hi = mid;
      }
      const q = (lo + hi) / 2;
      operating = { Q: q, H: pumpH0 * (1 - Math.pow(q / pumpQmax, 2)) };
    }
  }

  return {
    ...line,
    staticHead,
    H,
    hydraulicPower,
    shaftPower,
    suction,
    npsha,
    npshMargin: npshr != null ? npsha - npshr : null,
    curve,
    operating,
  };
}
