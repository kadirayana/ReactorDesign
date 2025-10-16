const dyn = require('../src/lib/dynamics')

test('cstrSeries approaches steady C_out', () => {
  const series = dyn.cstrSeries({ C0: 1, k: 0.1, tau: 10, simTime: 200, points: 201 })
  const last = series[series.length - 1].C
  const expected = dyn.cstrOut({ C0: 1, k: 0.1, tau: 10 })
  expect(last).toBeCloseTo(expected, 3)
})

test('pfrSeries starts at C0 and decreases', () => {
  const s = dyn.pfrSeries({ C0: 2, k: 0.2, V: 10, Q: 0.5, points: 11 })
  expect(s[0].C).toBeCloseTo(2)
  expect(s[s.length - 1].C).toBeLessThan(s[0].C)
})

test('michaelisSeries decreases substrate', () => {
  const s = dyn.michaelisSeries({ Vmax: 1, Km: 0.5, S0: 1, simTime: 10, points: 21 })
  expect(s[0].S).toBeCloseTo(1)
  expect(s[s.length - 1].S).toBeLessThanOrEqual(s[0].S)
})

test('multicomponentSeriesAdvanced mass conserved (A+B <= A0)', () => {
  const s = dyn.multicomponentSeriesAdvanced({ C0: 1, kA: 0.2, kB: 0.05, simTime: 10, points: 21 })
  for (let row of s) {
    expect(row.A + row.B).toBeLessThanOrEqual(1.0001)
  }
})
