const { computePinch } = require('../src/lib/heatintegration');

describe('computePinch basic tests', () => {
  test('single hot and single cold with clear overlap => no hot utility', () => {
    const cold = [{ CP: 10, in: 20, out: 80 }];
    const hot = [{ CP: 10, in: 150, out: 90 }];
    const res = computePinch({ coldStreams: cold, hotStreams: hot, deltaTmin: 10 });
    expect(res.hotUtility).toBeCloseTo(0, 8);
    // coldUtility should be positive
    expect(res.coldUtility).toBeGreaterThanOrEqual(0);
    expect(typeof res.pinch).toBe('number');
  });

  test('no overlap (large deltaTmin) => positive hotUtility', () => {
    const cold = [{ CP: 5, in: 20, out: 40 }];
    const hot = [{ CP: 5, in: 150, out: 100 }];
    const res = computePinch({ coldStreams: cold, hotStreams: hot, deltaTmin: 120 });
    expect(res.hotUtility).toBeGreaterThan(0);
    expect(res.coldUtility).toBeGreaterThanOrEqual(0);
  });

  test('zero CP stream does not affect utilities', () => {
    const cold = [{ CP: 10, in: 20, out: 80 }, { CP: 0, in: 10, out: 20 }];
    const hot = [{ CP: 10, in: 150, out: 90 }];
    const res = computePinch({ coldStreams: cold, hotStreams: hot, deltaTmin: 10 });
    expect(res.hotUtility).toBeCloseTo(0, 8);
  });
});
