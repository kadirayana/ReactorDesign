const { calculateReactorss } = require('../src/lib/reactorss');

// Recreate default inputs from pages/reactorss.js
const inputs = {
  prodName: 'Allyl Klorür',
  prodMolarMass: 76.5,
  prodStoich: 1,
  reactAName: 'Propylene',
  reactAStoich: 1,
  reactBName: 'Chlorine',
  reactBStoich: 1,
  conversion: 0.3,
  annualProd: 90000,
  opHours: 7200,
  reactionTemp: 783,
  P_total: 3,
  k0: 0.0322,
  E: 63.2,
  orderLim: 1,
  orderExc: 1,
  feedRatio: 5,
  limiting: 'A',
};

const res = calculateReactorss(inputs);
console.log('W:', res.W);
console.log('prodKmolH:', res.prodKmolH);
console.log('F0_lim:', res.F0_lim, 'F0_exc:', res.F0_exc);
console.log('r min/max:', res._diag.rMin, '/', res._diag.rMax);
console.log('integral:', res._diag.integral);

// print sample rpoints and Xpoints
for (let i = 0; i < Math.min(6, res.Xpoints.length); i++) {
  console.log(`X=${res.Xpoints[i].toFixed(4)} r=${res.rpoints[i].toExponential(3)} concLim=${res.concLim[i].toFixed(4)} nA=${res.concLim_kmolh[i].toFixed(4)}`);
}

// sensitivity to k0
console.log('\nSensitivity to k0:');
const k0vals = [inputs.k0 * 0.01, inputs.k0 * 0.1, inputs.k0, inputs.k0 * 10, inputs.k0 * 100];
for (const kv of k0vals) {
  const r = calculateReactorss({ ...inputs, k0: kv });
  console.log(`k0=${kv} -> W=${r.W.toFixed(3)} (rMin=${r._diag.rMin.toExponential(3)} rMax=${r._diag.rMax.toExponential(3)})`);
}
