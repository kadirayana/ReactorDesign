// Convection correlations (average heat transfer coefficients).
// Functions return { h [W/(m²·K)], Nu, Re | ReL | Ra, Pr, regime, warning }.
// Fluid properties default to air at ~20–40 °C when not provided.

function defaultAirProps() {
  return {
    k: 0.026, // W/(m·K)
    mu: 1.85e-5, // Pa·s
    cp: 1005, // J/(kg·K)
    rho: 1.2, // kg/m³
  };
}

function prFromProps(props) {
  return (props.cp * props.mu) / props.k;
}

// Dittus-Boelter, fully developed turbulent pipe flow (Re > 10⁴, 0.7 < Pr < 160).
// n = 0.4 when the fluid is heated, 0.3 when cooled.
export function dittusBoelter({ Re, Pr, k, D, heating = true }) {
  const Nu = 0.023 * Math.pow(Re, 0.8) * Math.pow(Pr, heating ? 0.4 : 0.3);
  return { Nu, h: D ? (Nu * k) / D : undefined };
}

// Gnielinski, turbulent/transitional pipe flow (3000 < Re < 5·10⁶, 0.5 < Pr < 2000)
export function gnielinski({ Re, Pr }) {
  const f = Math.pow(0.79 * Math.log(Re) - 1.64, -2); // Petukhov friction factor
  return (f / 8) * (Re - 1000) * Pr / (1 + 12.7 * Math.sqrt(f / 8) * (Math.pow(Pr, 2 / 3) - 1));
}

// Internal pipe flow, constant wall temperature
export function tubeForced({ Re, Pr, k, D }) {
  let Nu;
  let regime;
  let warning = null;
  if (Re < 2300) {
    Nu = 3.66; // fully developed laminar flow
    regime = 'laminar';
  } else {
    Nu = gnielinski({ Re, Pr });
    regime = Re < 1e4 ? 'transition' : 'turbulent';
    if (Re < 3000) warning = 'Re 2300–3000 geçiş bölgesinde; sonuç belirsizdir.';
  }
  return { Nu, h: (Nu * k) / D, regime, warning };
}

// External flow over a flat plate, average over length L (transition at Re = 5·10⁵)
export function flatPlateForced({ ReL, Pr, k, L }) {
  let Nu;
  let regime;
  if (ReL < 5e5) {
    Nu = 0.664 * Math.sqrt(ReL) * Math.pow(Pr, 1 / 3);
    regime = 'laminar';
  } else {
    // mixed laminar + turbulent boundary layer
    Nu = (0.037 * Math.pow(ReL, 0.8) - 871) * Math.pow(Pr, 1 / 3);
    regime = 'mixed';
  }
  const h = (Nu * k) / Math.max(1e-12, L);
  return { Nu, h, regime };
}

// Natural convection on a vertical plate, Churchill & Chu (all Ra)
export function verticalPlateNatural({ L, T_surface, T_inf, props = null }) {
  const p = props || defaultAirProps();
  if (!isFinite(T_surface) || !isFinite(T_inf)) throw new Error('Yüzey ve akışkan sıcaklıkları gerekli.');
  const beta = 1 / (273.15 + (T_surface + T_inf) / 2); // ideal gas at film temperature, 1/K
  const nu = p.mu / p.rho; // m²/s
  const g = 9.81;
  const deltaT = T_surface - T_inf;
  const Gr = (g * beta * Math.abs(deltaT) * Math.pow(L, 3)) / Math.pow(nu, 2);
  const Pr = prFromProps(p);
  const Ra = Gr * Pr;
  const Nu = Math.pow(0.825 + (0.387 * Math.pow(Ra, 1 / 6)) / Math.pow(1 + Math.pow(0.492 / Pr, 9 / 16), 8 / 27), 2);
  const h = (Nu * p.k) / Math.max(1e-12, L);
  return { Nu, h, Ra, Gr, Pr, regime: Ra < 1e9 ? 'laminar' : 'turbulent' };
}

export function computeConvection({ type = 'forced-flat', geometry = {}, fluid = null }) {
  const props = fluid || defaultAirProps();
  const Pr = prFromProps(props);
  if (type === 'forced-tube') {
    const D = Number(geometry.D);
    const V = Number(geometry.V);
    if (!(D > 0) || !(V > 0)) throw new Error('Boru çapı ve hız pozitif olmalıdır.');
    const Re = (props.rho * V * D) / props.mu;
    return { ...tubeForced({ Re, Pr, k: props.k, D }), Re, Pr };
  }
  if (type === 'forced-flat') {
    const L = Number(geometry.L);
    const V = Number(geometry.V);
    if (!(L > 0) || !(V > 0)) throw new Error('Uzunluk ve hız pozitif olmalıdır.');
    const ReL = (props.rho * V * L) / props.mu;
    return { ...flatPlateForced({ ReL, Pr, k: props.k, L }), ReL, Pr };
  }
  if (type === 'natural-vertical') {
    const L = Number(geometry.L);
    if (!(L > 0)) throw new Error('Plaka yüksekliği pozitif olmalıdır.');
    return verticalPlateNatural({ L, T_surface: Number(geometry.Ts), T_inf: Number(geometry.Tinf), props });
  }
  throw new Error(`Bilinmeyen konveksiyon tipi: ${type}`);
}

export default { computeConvection, dittusBoelter, gnielinski, tubeForced, flatPlateForced, verticalPlateNatural };
