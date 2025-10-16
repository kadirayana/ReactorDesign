const rad = require('../src/lib/radiation');

// blackbody: T=800K, A=1
const b = rad.blackbody({ T: 800, A: 1 });
console.log('Blackbody Q (800K,1m2):', b.Q);

// graybody: T=373K(100C), surroundings 293K
const g = rad.graybody({ T: 373, A: 1, epsilon: 0.9, T_surroundings: 293 });
console.log('Graybody Q (100C vs 20C):', g.Q);

// two-surface exchange
const t = rad.twoSurfaceExchange({ T1: 800, A1: 1, eps1: 0.8, T2: 300, A2: 2, eps2: 0.6, F12: 0.8 });
console.log('Two-surface Q:', t.Q);

console.log('Radiation tests done.');
