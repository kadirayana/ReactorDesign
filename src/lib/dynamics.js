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

// Enhanced: CSTR transient series using first-order kinetics and residence time
function cstrSeries({ C0 = 1, k = 0.1, tau = 10, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  let C = C0;
  const safeTau = Math.max(1e-12, tau);
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, C });
    // dC/dt = (C0 - C)/tau - k*C
    const dC = ((C0 - C) / safeTau - k * C) * dt;
    C += dC;
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
function michaelisSeries({ Vmax = 1, Km = 0.5, S0 = 1, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  let S = S0;
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, S });
    const dS = - (Vmax * S) / Math.max(1e-12, Km + S) * dt;
    S += dS;
    if (S < 0) S = 0;
  }
  return data;
}

// Improved multicomponent A -> B with optional B decay: dA/dt = -kA*A; dB/dt = kA*A - kB*B
function multicomponentSeriesAdvanced({ C0 = 1, kA = 0.1, kB = 0.0, simTime = 50, points = 101 } = {}) {
  const data = [];
  const dt = simTime / (points - 1);
  let A = C0, B = 0;
  for (let i = 0; i < points; i++) {
    const t = i * dt;
    data.push({ t, A, B });
    const dA = -kA * A * dt;
    const dB = (kA * A - kB * B) * dt;
    A += dA;
    B += dB;
    if (A < 0) A = 0;
    if (B < 0) B = 0;
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
