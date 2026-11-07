// Pure simulation helper functions for dynamics page

function dynamicSeries({ C0 = 1, k = 0.1, simTime = 50, points = 21 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, C: C0 * Math.exp(-k * t) });
  }
  return data;
}

function cstrOut({ C0 = 1, k = 0.1, tau = 10 } = {}) {
  return C0 / Math.max(1e-12, 1 + k * tau);
}

function pfrOut({ C0 = 1, k = 0.1, V = 50, Q = 0.01 } = {}) {
  // Using approximation C_out = C0 * exp(-k*V/Q)
  return C0 * Math.exp(-k * V / Math.max(1e-12, Q));
}

function equilibriumK({ deltaG = -10, T = 298 } = {}) {
  const R = 8.314; // J/(mol K)
  // deltaG in kJ/mol -> convert to J/mol
  return Math.exp(-deltaG * 1000 / Math.max(1e-12, R * T));
}

function heatTransferQ({ U = 100, A = 5, dT = 20 } = {}) {
  return U * A * dT;
}

function michaelisRate({ Vmax = 1, Km = 0.5, S0 = 1 } = {}) {
  return (Vmax * S0) / Math.max(1e-12, Km + S0);
}

function multicomponentSeries({ C0 = 1, kA = 0.1, kB = 0.05, simTime = 50, points = 21 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, A: C0 * Math.exp(-kA * t), B: C0 * Math.exp(-kB * t) });
  }
  return data;
}

// Classic 4th-order Runge-Kutta step for dy/dt = f(y) (autonomous scalar ODE)
function rk4Step(f, y, h) {
  const k1 = f(y);
  const k2 = f(y + 0.5 * h * k1);
  const k3 = f(y + 0.5 * h * k2);
  const k4 = f(y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

// CSTR start-up, first-order kinetics, reactor initially full of feed (C(0) = C0):
//   dC/dt = (C0 - C)/tau - k*C
// Exact solution: C(t) = Css + (C0 - Css) * exp(-(1/tau + k) t),  Css = C0 / (1 + k*tau)
function cstrSeries({ C0 = 1, k = 0.1, tau = 10, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  const safeTau = Math.max(1e-12, tau);
  const Css = C0 / (1 + k * safeTau);
  const lambda = 1 / safeTau + k;
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, C: Css + (C0 - Css) * Math.exp(-lambda * t) });
  }
  return data;
}

// PFR as series over V using analytic solution
function pfrSeries({ C0 = 1, k = 0.1, V = 50, Q = 0.01, points = 51 } = {}) {
  const data = [];
  const safeQ = Math.max(1e-12, Q);
  for (let i = 0; i < points; i++) {
    const v = (i / (points - 1)) * V;
    const C = C0 * Math.exp(-k * v / safeQ);
    data.push({ V: v, C });
  }
  return data;
}

// Equilibrium compute for A <-> B simple case: K = [B]/[A], mass balance A0 = A + B
function equilibriumCompute({ deltaG = -10, T = 298, A0 = 1 } = {}) {
  const R = 8.314; // J/(mol K)
  const K = Math.exp(-deltaG * 1000 / Math.max(1e-12, R * T));
  const Aeq = A0 / (1 + K);
  const Beq = A0 - Aeq;
  return { K, Aeq, Beq };
}

// Heat transfer transient for lumped system: T(t) = T_inf + (T0 - T_inf)*exp(-k*t)
function heatTransferTransient({ T0 = 300, T_inf = 293, mCp = 1000, U = 100, A = 1, simTime = 100, points = 51 } = {}) {
  const data = [];
  const h = (U * A) / Math.max(1e-12, mCp); // time constant coefficient
  const dt = simTime / (points - 1);
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    const T = T_inf + (T0 - T_inf) * Math.exp(-h * t);
    data.push({ t, T });
  }
  return data;
}

// Michaelis-Menten time series (substrate consumption): dS/dt = - (Vmax*S)/(Km+S)
// Integrated with RK4 using internal sub-steps so accuracy does not depend on the plotted point count.
function michaelisSeries({ Vmax = 1, Km = 0.5, S0 = 1, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  const rate = S => -(Vmax * S) / Math.max(1e-12, Km + S);
  // keep h * Vmax/Km well below the RK4 stability limit
  const subSteps = Math.max(1, Math.ceil((dt * Vmax) / (0.1 * Math.max(1e-12, Km))));
  const h = dt / subSteps;
  let S = S0;
  for (let i = 0; i < points; i++) {
    data.push({ t: i * dt, S });
    for (let j = 0; j < subSteps; j++) S = Math.max(0, rk4Step(rate, S, h));
  }
  return data;
}

// Improved multicomponent A -> B with optional B decay: dA/dt = -kA*A; dB/dt = kA*A - kB*B
// Exact (Bateman) solution with A(0) = C0, B(0) = 0:
//   A = C0 e^{-kA t}
//   B = C0 kA/(kB - kA) (e^{-kA t} - e^{-kB t})   (kA != kB)
//   B = C0 kA t e^{-kA t}                         (kA == kB)
function multicomponentSeriesAdvanced({ C0 = 1, kA = 0.1, kB = 0.0, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  const sameRate = Math.abs(kB - kA) < 1e-12 * Math.max(1, Math.abs(kA));
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    const A = C0 * Math.exp(-kA * t);
    const B = sameRate
      ? C0 * kA * t * Math.exp(-kA * t)
      : (C0 * kA / (kB - kA)) * (Math.exp(-kA * t) - Math.exp(-kB * t));
    data.push({ t, A, B });
  }
  return data;
}

module.exports = {
  dynamicSeries,
  cstrOut,
  pfrOut,
  equilibriumK,
  heatTransferQ,
  michaelisRate,
  multicomponentSeries,
  // advanced
  cstrSeries,
  pfrSeries,
  equilibriumCompute,
  heatTransferTransient,
  michaelisSeries,
  multicomponentSeriesAdvanced,
}
