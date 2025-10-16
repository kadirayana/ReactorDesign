const conv = require('../src/lib/convection');

function approxEqual(a,b,eps=1e-6){return Math.abs(a-b)<=eps}

// Test 1: forced tube with moderate Re
const res = conv.computeConvection({ type: 'forced-tube', geometry: { D: 0.05, V: 2.0 }, fluid: null });
console.log('Forced tube result:', res);
if(!res.h || res.h<=0) process.exitCode = 2;

// Test 2: natural vertical plate
const res2 = conv.computeConvection({ type: 'natural-vertical', geometry: { L: 1.0, Ts: 80, Tinf: 20 }, fluid: null });
console.log('Natural vertical plate:', res2);
if(!res2.h || res2.h<=0) process.exitCode = 3;

console.log('Convection tests done.');
