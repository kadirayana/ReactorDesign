// Ideal reactor sizing for a single irreversible reaction A -> products with
// power-law kinetics  -rA = k * CA^n  (n = 0, 1 or 2), constant density.
//
// Units (SI, consistent with the UI):
//   F_A0 [mol/s], C_A0 [mol/m³], k: n=0 mol/(m³·s), n=1 1/s, n=2 m³/(mol·s)
//   => v0 = F_A0 / C_A0 [m³/s], tau [s], V [m³], batch time [s]
//
// "Plug" reactors (PFR, PBR, batch) integrate the design equation;
// the CSTR uses the algebraic (mixed-flow) design equation.

const SUPPORTED_ORDERS = [0, 1, 2];

export function rateConstantUnits(order) {
  if (order === 0) return 'mol/(m³·s)';
  if (order === 1) return '1/s';
  if (order === 2) return 'm³/(mol·s)';
  return '';
}

/** Units of k' for a packed bed (rate per kg of catalyst). */
export function catalystRateConstantUnits(order) {
  if (order === 0) return 'mol/(kg·s)';
  if (order === 1) return 'm³/(kg·s)';
  if (order === 2) return 'm⁶/(mol·kg·s)';
  return '';
}

/**
 * Internal effectiveness factor of a spherical catalyst pellet, first-order reaction:
 *   η = (3/φ²)(φ·coth φ − 1),  φ = Thiele modulus. η → 1 as φ → 0.
 */
export function effectivenessFromThiele(phi) {
  const p = Number(phi);
  if (!isFinite(p) || p < 0) throw new Error('Thiele modülü negatif olamaz.');
  if (p < 1e-3) return 1 - (p * p) / 15; // series expansion avoids 0/0
  return (3 / (p * p)) * (p / Math.tanh(p) - 1);
}

/** Space time (or batch time) needed to reach conversion X. */
export function tauForConversion(kind, order, k, C0, X) {
  if (kind === 'plug') {
    if (order === 0) return (C0 * X) / k;
    if (order === 1) return -Math.log(1 - X) / k;
    if (order === 2) return X / (k * C0 * (1 - X));
  } else if (kind === 'mixed') {
    if (order === 0) return (C0 * X) / k;
    if (order === 1) return X / (k * (1 - X));
    if (order === 2) return X / (k * C0 * (1 - X) * (1 - X));
  }
  throw new Error(`Desteklenmeyen reaktör/derece: ${kind}, n=${order}`);
}

/** Conversion reached after space time (or batch time) tau. Inverse of tauForConversion. */
export function conversionAt(kind, order, k, C0, tau) {
  if (tau <= 0) return 0;
  if (order === 0) return Math.min(1, (k * tau) / C0);
  if (kind === 'plug') {
    if (order === 1) return 1 - Math.exp(-k * tau);
    if (order === 2) { const a = k * C0 * tau; return a / (1 + a); }
  } else if (kind === 'mixed') {
    if (order === 1) { const a = k * tau; return a / (1 + a); }
    if (order === 2) {
      // k*C0*tau*(1-X)^2 = X  ->  root of a X^2 - (2a+1) X + a = 0 lying in [0,1)
      const a = k * C0 * tau;
      return ((2 * a + 1) - Math.sqrt(4 * a + 1)) / (2 * a);
    }
  }
  throw new Error(`Desteklenmeyen reaktör/derece: ${kind}, n=${order}`);
}

function positive(value, message) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) throw new Error(message);
  return n;
}

export function calculateBasicReactor(inputs) {
  const {
    reactorType,
    reactionOrder,
    flowRate,
    initialConc,
    rateConstant,
    targetConversion,
    catDensity = 1000,
    effectiveRateConstant = 0.1,
    effectivenessFactor = 0.8,
    selectivity: selectivityInput = 1,
    points = 100,
  } = inputs;

  const order = Number(reactionOrder);
  if (!SUPPORTED_ORDERS.includes(order)) throw new Error('Reaksiyon derecesi 0, 1 veya 2 olmalıdır.');

  const F0 = positive(flowRate, 'Mol akış hızı (>0) girin.');
  const C0 = positive(initialConc, 'Başlangıç konsantrasyonu (>0) girin.');
  const X = Number(targetConversion);
  if (!isFinite(X) || X <= 0 || X >= 1) throw new Error('Hedef dönüşüm 0 < X < 1 aralığında olmalıdır.');
  const selectivity = Number(selectivityInput);
  if (!isFinite(selectivity) || selectivity < 0 || selectivity > 1) throw new Error('Seçicilik 0 ile 1 arasında olmalıdır.');

  let kind;
  let k;
  if (reactorType === 'pbr') {
    // -r'A = k' * CA^n per kg catalyst; per reactor volume: k' * eta * rho_b
    const kCat = positive(effectiveRateConstant, 'Katalizöre özgü hız sabiti (>0) girin.');
    const eta = positive(effectivenessFactor, 'Etkinlik faktörü (>0) girin.');
    const rhoB = positive(catDensity, 'Katalizör yoğunluğu (>0) girin.');
    k = kCat * eta * rhoB;
    kind = 'plug';
  } else {
    k = positive(rateConstant, 'Hız sabiti (>0) girin.');
    if (reactorType === 'pfr' || reactorType === 'batch') kind = 'plug';
    else if (reactorType === 'cstr') kind = 'mixed';
    else throw new Error(`Bilinmeyen reaktör tipi: ${reactorType}`);
  }

  const tau = tauForConversion(kind, order, k, C0, X);
  const v0 = F0 / C0;
  const isBatch = reactorType === 'batch';

  const reactorVolume = isBatch ? null : v0 * tau;
  const batchTime = isBatch ? tau : null;
  const spaceTime = isBatch ? null : tau;
  const spaceVelocity = isBatch ? null : 1 / tau;
  const catalystWeight = reactorType === 'pbr' ? reactorVolume * Number(catDensity) : null;

  // Profiles along the real design axis, ending exactly at the target conversion.
  let profileAxis;
  if (isBatch) profileAxis = 'Süre [s]';
  else if (kind === 'mixed') profileAxis = 'Uzay zamanı τ [s]';
  else profileAxis = 'Reaktör hacmi [m³]';

  const conversionProfile = [];
  const concentrationProfile = [];
  for (let i = 0; i <= points; i++) {
    const z = i / points;
    const t = tau * z;
    const conv = conversionAt(kind, order, k, C0, t);
    const xAxis = isBatch || kind === 'mixed' ? t : reactorVolume * z;
    conversionProfile.push({ x: xAxis, y: conv });
    concentrationProfile.push({ x: xAxis, y: C0 * (1 - conv) });
  }

  return {
    order,
    kind,
    k,
    v0,
    reactorVolume,
    batchTime,
    spaceTime,
    spaceVelocity,
    catalystWeight,
    selectivity,
    yield: X * selectivity,
    profileAxis,
    conversionProfile,
    concentrationProfile,
  };
}
