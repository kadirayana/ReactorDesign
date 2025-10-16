// Basic convection correlations
// Functions return an object { h: <heat transfer coeff W/m2K>, Nu: <Nusselt>, Re, Pr }
// Note: properties for air at ~20-40°C are approximated when not provided.

function defaultAirProps() {
  return {
    k: 0.026, // W/mK
    mu: 1.85e-5, // Pa s
    cp: 1005, // J/kgK
    rho: 1.2, // kg/m3
  };
}

function prFromProps(props) {
  return (props.cp * props.mu) / props.k;
}

// Dittus-Boelter for internal turbulent flow (Re > 10000)
export function dittusBoelter({ Re, Pr, k }) {
  const Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, 0.4);
  const h = Nu * k; // caller divides by L (characteristic length)
  return { Nu, h };
}

// External flat plate turbulent (approx) using turbulent boundary layer corr
export function flatPlateForced({ ReL, Pr, k, L }) {
  // Local Nu ~ 0.037 Re_L^{4/5} Pr^{1/3} for turbulent (valid Re_L>5e5)
  const Nu = 0.037 * Math.pow(ReL, 4 / 5) * Math.pow(Pr, 1 / 3);
  const h = (Nu * k) / L;
  return { Nu, h };
}

// Natural convection vertical plate (Churchill and Chu)
export function verticalPlateNatural({ L, T_surface, T_inf, props = null }) {
  const p = props || defaultAirProps();
  const beta = 1 / (273.15 + (T_surface + T_inf) / 2); // 1/K approximated
  const nu = p.mu / p.rho; // m2/s
  const g = 9.81;
  const deltaT = T_surface - T_inf;
  const Gr = (g * beta * Math.abs(deltaT) * Math.pow(L, 3)) / Math.pow(nu, 2);
  const Pr = prFromProps(p);
  const Ra = Gr * Pr;
  // Churchill and Chu correlation for vertical plate (laminar-turbulent blended)
  const Nu = 0.68 + (0.670 * Math.pow(Ra, 1 / 4)) / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 4 / 9);
  const h = (Nu * p.k) / L;
  return { Nu, h, Ra, Gr, Pr };
}

// Simple wrapper to compute h for common scenarios
export function computeConvection({ type = 'forced-flat', geometry = {}, fluid = null }) {
  const props = fluid || defaultAirProps();
  const Pr = prFromProps(props);
  if (type === 'forced-tube') {
    // geometry: { D, V }
    const D = geometry.D;
    const V = geometry.V;
    const Re = (props.rho * V * D) / props.mu;
    const { Nu } = dittusBoelter({ Re, Pr, k: props.k });
    const h = (Nu * props.k) / D;
    return { h, Nu, Re, Pr };
  } else if (type === 'forced-flat') {
    // geometry: { L, V }
    const L = geometry.L;
    const V = geometry.V;
    const ReL = (props.rho * V * L) / props.mu;
    const { Nu, h } = flatPlateForced({ ReL, Pr, k: props.k, L });
    return { h, Nu, ReL, Pr };
  } else if (type === 'natural-vertical') {
    return verticalPlateNatural({ L: geometry.L, T_surface: geometry.Ts, T_inf: geometry.Tinf, props });
  }
  // fallback simple h estimate
  return { h: 10, Nu: null, Re: null, Pr };
}

export default { computeConvection, dittusBoelter, flatPlateForced, verticalPlateNatural };
