// Reactor optimisation over temperature and volume.
//
// Model: parallel first-order reactions in an isothermal CSTR or PFR
//   A -> B (desired),  k1 = k01·exp(−Ea1/RT)
//   A -> C (side),     k2 = k02·exp(−Ea2/RT)
// τ = V/Q,  k = k1 + k2
//   CSTR: X = kτ/(1+kτ)     PFR: X = 1 − e^(−kτ)
// Selectivity (fraction of converted A that becomes B): S = k1/(k1+k2)
// Yield: Y = X·S
// Cost [$/period]: c_V·V + c_T·max(0, T − 25 °C)

const R = 8.314;

export function evaluateDesign({ T, V, Q = 1, k01 = 1e6, Ea1 = 50, k02 = 1e9, Ea2 = 75, type = 'CSTR', costV = 100, costT = 10 }) {
  const TK = T + 273.15;
  const k1 = k01 * Math.exp(-(Ea1 * 1000) / (R * TK));
  const k2 = k02 * Math.exp(-(Ea2 * 1000) / (R * TK));
  const k = k1 + k2;
  const tau = V / Q;
  const X = type === 'CSTR' ? (k * tau) / (1 + k * tau) : 1 - Math.exp(-k * tau);
  const S = k > 0 ? k1 / k : 0;
  return { T, V, k1, k2, tau, X, S, Y: X * S, cost: costV * V + costT * Math.max(0, T - 25) };
}

const OBJECTIVES = {
  conversion: { key: 'X', sense: 1 },
  selectivity: { key: 'S', sense: 1 },
  yield: { key: 'Y', sense: 1 },
  cost: { key: 'cost', sense: -1 },
};

export function objectiveValue(design, objective) {
  const o = OBJECTIVES[objective];
  if (!o) throw new Error(`Bilinmeyen hedef: ${objective}`);
  return design[o.key];
}

function feasible(d, minX, minS) {
  return d.X >= minX - 1e-12 && d.S >= minS - 1e-12;
}

/**
 * Grid search followed by a compass (pattern) search refinement.
 * Constraints: X ≥ minX, S ≥ minS. Returns the best design, every grid sample
 * (for plots) and the conversion–cost Pareto front.
 */
export function optimizeReactor(params) {
  const { objective = 'yield', Tmin, Tmax, Vmin, Vmax, minX = 0, minS = 0, gridSize = 41 } = params;
  if (!(Tmax > Tmin) || !(Vmax > Vmin) || !(Vmin > 0)) throw new Error('Aralıklar geçersiz: min < maks ve hacim > 0 olmalıdır.');
  if (!(params.Q > 0)) throw new Error('Debi pozitif olmalıdır.');
  const { sense } = OBJECTIVES[objective] || {};
  if (!sense) throw new Error(`Bilinmeyen hedef: ${objective}`);

  const score = d => (feasible(d, minX, minS) ? sense * objectiveValue(d, objective) : -Infinity);
  const evalAt = (T, V) => evaluateDesign({ ...params, T, V });

  const samples = [];
  let best = null;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const d = evalAt(Tmin + ((Tmax - Tmin) * i) / (gridSize - 1), Vmin + ((Vmax - Vmin) * j) / (gridSize - 1));
      samples.push(d);
      if (best === null || score(d) > score(best)) best = d;
    }
  }
  if (score(best) === -Infinity) {
    return { best: null, samples, front: paretoFront(samples), feasible: false };
  }

  // Compass search inside the bounds
  let stepT = (Tmax - Tmin) / (gridSize - 1);
  let stepV = (Vmax - Vmin) / (gridSize - 1);
  for (let it = 0; it < 200 && (stepT > 1e-4 * (Tmax - Tmin) || stepV > 1e-4 * (Vmax - Vmin)); it++) {
    let improved = false;
    for (const [dT, dV] of [[stepT, 0], [-stepT, 0], [0, stepV], [0, -stepV]]) {
      const T = Math.min(Tmax, Math.max(Tmin, best.T + dT));
      const V = Math.min(Vmax, Math.max(Vmin, best.V + dV));
      const d = evalAt(T, V);
      if (score(d) > score(best) + 1e-15) { best = d; improved = true; }
    }
    if (!improved) { stepT /= 2; stepV /= 2; }
  }

  return { best, samples, front: paretoFront(samples), feasible: true };
}

/** Non-dominated designs for (maximise X, minimise cost), sorted by cost. */
export function paretoFront(samples) {
  const sorted = [...samples].sort((a, b) => a.cost - b.cost || b.X - a.X);
  const front = [];
  let bestX = -Infinity;
  for (const d of sorted) {
    if (d.X > bestX + 1e-12) { front.push(d); bestX = d.X; }
  }
  return front;
}

/** Objective along one variable with the other held fixed. */
export function sensitivity(params, { variable = 'T', min, max, steps = 41, fixed }) {
  const n = Math.max(3, Math.floor(steps));
  return Array.from({ length: n }, (_, i) => {
    const x = min + ((max - min) * i) / (n - 1);
    return evaluateDesign({ ...params, T: variable === 'T' ? x : fixed, V: variable === 'V' ? x : fixed });
  });
}
