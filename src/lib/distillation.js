// Binary distillation with constant relative volatility α and constant molar overflow.
//
// Compositions are mole fractions of the light (more volatile) component.
// q = feed thermal condition: 1 saturated liquid, 0 saturated vapour,
//     q > 1 subcooled liquid, q < 0 superheated vapour.

/** Equilibrium vapour composition y(x) = αx / (1 + (α−1)x) */
export function equilibriumY(x, alpha) {
  return (alpha * x) / (1 + (alpha - 1) * x);
}

/** Inverse: liquid in equilibrium with vapour y. */
export function equilibriumX(y, alpha) {
  return y / (alpha - (alpha - 1) * y);
}

function validate({ alpha, zF, xD, xB, q }) {
  if (!(alpha > 1)) throw new Error('Bağıl uçuculuk α 1’den büyük olmalıdır.');
  if (!(xB > 0 && xB < zF && zF < xD && xD < 1)) throw new Error('0 < x_B < z_F < x_D < 1 olmalıdır.');
  if (!Number.isFinite(q)) throw new Error('Besleme durumu q sayısal olmalıdır.');
}

/** Point where the q-line meets the equilibrium curve (pinch for minimum reflux). */
export function qLinePinch({ alpha, zF, q }) {
  if (Math.abs(q - 1) < 1e-9) return { x: zF, y: equilibriumY(zF, alpha) };
  // q-line: y = q/(q−1)·x − zF/(q−1); solve eq(x) − qline(x) = 0 by bisection on (0, 1)
  const qline = x => (q / (q - 1)) * x - zF / (q - 1);
  const g = x => equilibriumY(x, alpha) - qline(x);
  let lo = 1e-12;
  let hi = 1 - 1e-12;
  if (g(lo) * g(hi) > 0) throw new Error('q-doğrusu denge eğrisini kesmiyor; q değerini kontrol edin.');
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid;
  }
  const x = (lo + hi) / 2;
  return { x, y: equilibriumY(x, alpha) };
}

/** Minimum reflux from the q-line pinch (valid for ideal, constant-α systems). */
export function minimumReflux({ alpha, zF, xD, q }) {
  const p = qLinePinch({ alpha, zF, q });
  return (xD - p.y) / (p.y - p.x);
}

/** Fenske minimum number of theoretical stages (total reflux), including the reboiler. */
export function fenske({ alpha, xD, xB }) {
  return Math.log((xD / (1 - xD)) * ((1 - xB) / xB)) / Math.log(alpha);
}

/** Underwood minimum reflux for a binary with constant α (independent check of McCabe–Thiele). */
export function underwood({ alpha, zF, xD, q }) {
  // Σ αᵢ zᵢ / (αᵢ − θ) = 1 − q, root with 1 < θ < α (relative volatilities vs heavy key)
  const h = theta => (alpha * zF) / (alpha - theta) + (1 - zF) / (1 - theta) - (1 - q);
  let lo = 1 + 1e-12;
  let hi = alpha - 1e-12;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (h(lo) * h(mid) <= 0) hi = mid; else lo = mid;
  }
  const theta = (lo + hi) / 2;
  const Rmin = (alpha * xD) / (alpha - theta) + (1 - xD) / (1 - theta) - 1;
  return { theta, Rmin };
}

/** Gilliland correlation (Eduljee form): theoretical stages at reflux R. */
export function gilliland({ R, Rmin, Nmin }) {
  const X = (R - Rmin) / (R + 1);
  const Y = 0.75 * (1 - Math.pow(X, 0.5668));
  return { X, Y, N: (Nmin + Y) / (1 - Y) };
}

/**
 * McCabe–Thiele stage stepping from the top (x_D, x_D).
 * Returns the staircase, stage count (with fractional last stage) and optimal feed stage.
 * Stage 1 is the top tray; the last stage is the partial reboiler.
 */
export function mccabeThiele({ alpha, zF, xD, xB, q, R, maxStages = 200 }) {
  validate({ alpha, zF, xD, xB, q });
  const Rmin = minimumReflux({ alpha, zF, xD, q });
  if (!(R > Rmin)) throw new Error(`Geri akış oranı minimumun (Rmin = ${Rmin.toFixed(3)}) üzerinde olmalıdır.`);

  // Intersection of the rectifying line with the q-line
  const xi = Math.abs(q - 1) < 1e-9
    ? zF
    : (zF / (q - 1) + xD / (R + 1)) / (q / (q - 1) - R / (R + 1));
  const yi = (R / (R + 1)) * xi + xD / (R + 1);
  const rect = x => (R / (R + 1)) * x + xD / (R + 1);
  const stripSlope = (yi - xB) / (xi - xB);
  const strip = x => xB + stripSlope * (x - xB);

  const steps = [{ x: xD, y: xD }];
  let x = xD;
  let y = xD;
  let stages = 0;
  let feedStage = null;
  let fractional = null;
  while (stages < maxStages) {
    const xNew = equilibriumX(y, alpha);
    stages += 1;
    steps.push({ x: xNew, y });
    if (xNew <= xB) {
      fractional = stages - 1 + (x - xB) / (x - xNew);
      break;
    }
    const onStripping = xNew < xi;
    if (onStripping && feedStage === null) feedStage = stages;
    const yNew = onStripping ? strip(xNew) : rect(xNew);
    steps.push({ x: xNew, y: yNew });
    x = xNew;
    y = yNew;
  }
  if (fractional === null) throw new Error(`${maxStages} kademede ayırım sağlanamadı; geri akışı artırın.`);

  return {
    Rmin,
    stages,
    fractionalStages: fractional,
    feedStage: feedStage ?? stages,
    steps,
    intersection: { x: xi, y: yi },
    stripSlope,
  };
}

/** Full shortcut + graphical design with material and energy balances. */
export function designColumn({ alpha, zF, xD, xB, q, Rfactor, F = 100, lambda = 30 }) {
  validate({ alpha, zF, xD, xB, q });
  if (!(Rfactor > 1)) throw new Error('R/Rmin oranı 1’den büyük olmalıdır.');
  const Rmin = minimumReflux({ alpha, zF, xD, q });
  const R = Rfactor * Rmin;
  const mt = mccabeThiele({ alpha, zF, xD, xB, q, R });
  const Nmin = fenske({ alpha, xD, xB });
  const uw = underwood({ alpha, zF, xD, q });
  const gl = gilliland({ R, Rmin, Nmin });

  // Material balance
  const D = (F * (zF - xB)) / (xD - xB);
  const B = F - D;
  const L = R * D;
  const V = (R + 1) * D;
  const Vbar = V - (1 - q) * F;
  const Lbar = L + q * F;

  // Kirkbride feed location (binary: light key = light component)
  const kirk = Math.pow((B / D) * ((1 - zF) / zF) * Math.pow(xB / (1 - xD), 2), 0.206);
  const Ntrays = gl.N; // includes reboiler
  const NR = (Ntrays * kirk) / (1 + kirk);

  return {
    R, Rmin, Nmin,
    underwoodRmin: uw.Rmin,
    gilliland: gl,
    mccabe: mt,
    D, B, L, V, Vbar, Lbar,
    recoveryLight: (D * xD) / (F * zF),
    condenserDuty: V * lambda, // [kJ/mol]·[mol/s] = kW when F is in mol/s
    reboilerDuty: Vbar * lambda,
    kirkbrideFeedStage: NR + 1,
  };
}
