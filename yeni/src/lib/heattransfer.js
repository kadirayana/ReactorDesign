// Simple heat transfer calculation utilities
// Exports calculateHeatTransfer which returns total heat duty (Q) using LMTD
// and simple temperature profiles for plotting and verification.

function linspace(n) {
  const arr = [];
  for (let i = 0; i <= n; i++) arr.push(i / n);
  return arr;
}

export function calculateHeatTransfer({ U = 500, A = 10, Th_in = 150, Th_out = 100, Tc_in = 30, Tc_out = 80, points = 50 } = {}) {
  // Temperatures are assumed in degrees Celsius; U in W/m^2K; A in m^2 => Q in Watts
  const deltaT1 = Th_in - Tc_out;
  const deltaT2 = Th_out - Tc_in;

  // Handle potential division by zero or negative/zero deltaTs
  let LMTD = 0;
  if (Math.abs(deltaT1 - deltaT2) < 1e-12) {
    LMTD = deltaT1; // limits to deltaT when nearly equal
  } else if (deltaT1 <= 0 || deltaT2 <= 0) {
    // physically invalid counter-current conditions; still compute using absolute values
    LMTD = Math.abs((deltaT1 - deltaT2) / Math.log((Math.max(Math.abs(deltaT1), 1e-6)) / (Math.max(Math.abs(deltaT2), 1e-6))));
  } else {
    LMTD = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  }

  const Q = U * A * LMTD; // Watts

  // Build simple axial profiles assuming linear temperature change along area
  const xs = linspace(points);
  const Th = xs.map(x => Th_in + (Th_out - Th_in) * x);
  const Tc = xs.map(x => Tc_in + (Tc_out - Tc_in) * x);
  const dT = Th.map((t, i) => t - Tc[i]);

  return {
    Q,
    LMTD,
    deltaT1,
    deltaT2,
    profiles: {
      x: xs,
      Th,
      Tc,
      dT
    }
  };
}

export default calculateHeatTransfer;
