const { dynamicSeries, cstrOut, pfrOut, equilibriumK, heatTransferQ, michaelisRate, multicomponentSeries } = require('../src/lib/dynamics')

test('dynamicSeries produces expected first and last point', () => {
  const d = dynamicSeries({ C0: 1, k: 0.1, simTime: 10, points: 3 });
  expect(d.length).toBe(3);
  expect(d[0].t).toBeCloseTo(0);
  expect(d[0].C).toBeCloseTo(1);
  expect(d[2].t).toBeCloseTo(10);
});

test('cstrOut formula', () => {
  expect(cstrOut({ C0: 1, k: 0.2, tau: 5 })).toBeCloseTo(1 / (1 + 0.2 * 5));
});

test('pfrOut formula', () => {
  expect(pfrOut({ C0: 2, k: 0.1, V: 10, Q: 0.5 })).toBeCloseTo(2 * Math.exp(-0.1 * 10 / 0.5));
});

test('equilibriumK reasonable sign', () => {
  const K = equilibriumK({ deltaG: -10, T: 298 });
  expect(K).toBeGreaterThan(0);
});

test('heatTransferQ simple', () => {
  expect(heatTransferQ({ U: 10, A: 2, dT: 5 })).toBe(10 * 2 * 5);
});

test('michaelisRate typical', () => {
  expect(michaelisRate({ Vmax: 1, Km: 0.5, S0: 1 })).toBeCloseTo((1 * 1) / (0.5 + 1));
});

test('multicomponentSeries returns A and B', () => {
  const m = multicomponentSeries({ C0: 1, kA: 0.1, kB: 0.05, simTime: 10, points: 3 });
  expect(m.length).toBe(3);
  expect(Object.prototype.hasOwnProperty.call(m[0], 'A')).toBe(true);
  expect(Object.prototype.hasOwnProperty.call(m[0], 'B')).toBe(true);
});
