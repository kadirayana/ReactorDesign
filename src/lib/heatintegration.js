// computePinch: safe pinch/cascade computation for heat integration
// Streams: arrays of { CP, in, out }
function computePinch({ coldStreams = [], hotStreams = [], deltaTmin = 20, eps = 1e-9 } = {}) {
  if (typeof deltaTmin !== 'number' || Number.isNaN(deltaTmin) || deltaTmin <= 0) {
    throw new Error('deltaTmin must be a positive number');
  }

  const shift = deltaTmin / 2;

  const norm = s => ({ CP: Number(s.CP), in: Number(s.in), out: Number(s.out) });

  const cStreams = coldStreams.map(s => {
    const n = norm(s);
    return { CP: n.CP, in: n.in + shift, out: n.out + shift };
  });
  const hStreams = hotStreams.map(s => {
    const n = norm(s);
    return { CP: n.CP, in: n.in - shift, out: n.out - shift };
  });

  // Collect temperatures with rounding to avoid float duplicates
  const round = t => Math.round(t * 1e6) / 1e6;
  const tempsSet = new Set();
  [...cStreams, ...hStreams].forEach(s => { tempsSet.add(round(s.in)); tempsSet.add(round(s.out)); });
  const temps = Array.from(tempsSet).map(Number).sort((a, b) => b - a);

  // helper: check interval fully inside stream range (with tiny eps)
  function intervalInside(T_high, T_low, sIn, sOut) {
    const sLow = Math.min(sIn, sOut), sHigh = Math.max(sIn, sOut);
    return (sLow <= T_low + eps) && (sHigh >= T_high - eps);
  }

  const intervals = [];
  for (let i = 0; i < temps.length - 1; i++) {
    const T_high = temps[i], T_low = temps[i + 1];
    const dT = T_high - T_low;
    let netCP = 0;
    let hotCP = 0;
    let coldCP = 0;
    hStreams.forEach(s => { if (intervalInside(T_high, T_low, s.in, s.out)) netCP += s.CP; });
    cStreams.forEach(s => { if (intervalInside(T_high, T_low, s.in, s.out)) netCP -= s.CP; });
    // accumulate hotCP and coldCP for visualization
    hStreams.forEach(s => { if (intervalInside(T_high, T_low, s.in, s.out)) hotCP += s.CP; });
    cStreams.forEach(s => { if (intervalInside(T_high, T_low, s.in, s.out)) coldCP += s.CP; });
    const Q = netCP * dT;
    intervals.push({ T_high, T_low, dT, netCP, Q, hotCP, coldCP });
  }

  // cascade cumulative sums starting at 0
  const cascade = [0];
  for (const it of intervals) cascade.push(cascade[cascade.length - 1] + it.Q);

  const minCascade = Math.min(...cascade);
  const pinchIndex = cascade.indexOf(minCascade);
  const hotUtility = minCascade < 0 ? -minCascade : 0;
  const shiftedCascade = cascade.map(v => v + hotUtility);
  const coldUtility = shiftedCascade[shiftedCascade.length - 1];
  const pinchShifted = (pinchIndex < temps.length) ? temps[pinchIndex] : null;
  const pinch = pinchShifted != null ? (pinchShifted - shift) : null;

  return {
    hotUtility,
    coldUtility,
    pinch,
    pinchShifted,
    // temps returned descending (shifted). Also provide ascending unshifted temps for plotting convenience
    temps,
    tempsAscending: temps.slice().reverse().map(t => t - shift),
    intervals,
    cascade: shiftedCascade
  };
}

module.exports = { computePinch };
