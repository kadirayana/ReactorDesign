import {
  designColumn, mccabeThiele, minimumReflux, underwood, fenske, gilliland, equilibriumX, equilibriumY,
} from '../src/lib/distillation';
import { frictionFactor, pipeLoss, pumpSystem } from '../src/lib/fluids';
import { evaluateDesign, optimizeReactor, paretoFront } from '../src/lib/optimization';
import { conduction, effectivenessNTU, calculateHeatTransfer } from '../src/lib/heattransfer';
import { effectivenessFromThiele } from '../src/lib/reactor';
import { compositeCurves } from '../src/lib/heatintegration';

describe('distillation', () => {
  const base = { alpha: 2.5, zF: 0.5, xD: 0.95, xB: 0.05, q: 1 };

  test('equilibrium curve and its inverse', () => {
    expect(equilibriumY(0.5, 2.5)).toBeCloseTo(1.25 / 1.75, 12);
    expect(equilibriumX(equilibriumY(0.3, 2.5), 2.5)).toBeCloseTo(0.3, 12);
  });

  test('saturated-liquid feed: Rmin = (xD − y*)/(y* − zF)', () => {
    const y = 1.25 / 1.75;
    expect(minimumReflux(base)).toBeCloseTo((0.95 - y) / (y - 0.5), 10);
  });

  test.each([1, 0.5, 0, 1.3])('Underwood and McCabe–Thiele pinch agree for q = %s', q => {
    expect(underwood({ ...base, q }).Rmin).toBeCloseTo(minimumReflux({ ...base, q }), 6);
  });

  test('Fenske: Nmin = ln[(xD/(1−xD))((1−xB)/xB)] / ln α', () => {
    expect(fenske(base)).toBeCloseTo(Math.log(19 * 19) / Math.log(2.5), 12);
  });

  test('Gilliland: N → Nmin at total reflux and grows as R → Rmin', () => {
    expect(gilliland({ R: 1e9, Rmin: 1, Nmin: 6 }).N).toBeCloseTo(6, 2);
    expect(gilliland({ R: 1.05, Rmin: 1, Nmin: 6 }).N).toBeGreaterThan(gilliland({ R: 2, Rmin: 1, Nmin: 6 }).N);
  });

  test('McCabe–Thiele needs more stages than Nmin and fewer at higher reflux', () => {
    const r15 = mccabeThiele({ ...base, R: 1.5 * 1.1 });
    const r30 = mccabeThiele({ ...base, R: 3 * 1.1 });
    expect(r15.fractionalStages).toBeGreaterThan(fenske(base));
    expect(r30.fractionalStages).toBeLessThan(r15.fractionalStages);
    expect(r15.feedStage).toBeGreaterThan(1);
    expect(r15.feedStage).toBeLessThan(r15.stages);
  });

  test('staircase starts at (xD, xD) and lies on the equilibrium curve at each stage', () => {
    const r = mccabeThiele({ ...base, R: 2 });
    expect(r.steps[0]).toEqual({ x: 0.95, y: 0.95 });
    for (let i = 1; i < r.steps.length; i += 2) {
      expect(equilibriumY(r.steps[i].x, 2.5)).toBeCloseTo(r.steps[i].y, 10);
    }
  });

  test('material balance closes', () => {
    const c = designColumn({ ...base, Rfactor: 1.5, F: 100 });
    expect(c.D + c.B).toBeCloseTo(100, 10);
    expect(c.D * 0.95 + c.B * 0.05).toBeCloseTo(100 * 0.5, 10);
    expect(c.D).toBeCloseTo(50, 10);
  });

  test('reflux below minimum is rejected', () => {
    expect(() => mccabeThiele({ ...base, R: 1.0 })).toThrow();
  });
});

describe('pipe flow and pumps', () => {
  const water = { rho: 998.2, mu: 1.002e-3 };

  test('laminar friction factor is 64/Re', () => {
    expect(frictionFactor(1000, 0.001).f).toBeCloseTo(0.064, 12);
  });

  test('Colebrook matches Moody chart values', () => {
    // smooth pipe, Re = 1e5: f ≈ 0.0180
    expect(frictionFactor(1e5, 0).f).toBeCloseTo(0.0180, 3);
    // fully rough, ε/D = 0.01: f → 0.0379 (von Kármán)
    expect(frictionFactor(1e8, 0.01).f).toBeCloseTo(0.0379, 3);
  });

  test('Darcy–Weisbach head loss', () => {
    const r = pipeLoss({ Q: 0.005, D: 0.05, L: 100, eps: 0.045e-3, ...water, sumK: 2 });
    const V = 0.005 / (Math.PI * 0.05 * 0.05 / 4);
    expect(r.V).toBeCloseTo(V, 12);
    expect(r.hf).toBeCloseTo(r.f * (100 / 0.05) * V * V / (2 * 9.81), 10);
    expect(r.hm).toBeCloseTo(2 * V * V / (2 * 9.81), 10);
  });

  test('pump head, power and NPSHa', () => {
    const r = pumpSystem({ Q: 0.005, D: 0.05, L: 100, eps: 0.045e-3, ...water, pv: 2339, sumK: 5, dz: 10, dP: 50000, efficiency: 0.7, Ps: 101325, zs: 2, Ls: 0, sumKs: 0 });
    expect(r.staticHead).toBeCloseTo(10 + 50000 / (998.2 * 9.81), 10);
    expect(r.H).toBeCloseTo(r.staticHead + r.hTotal, 10);
    expect(r.shaftPower).toBeCloseTo(998.2 * 9.81 * 0.005 * r.H / 0.7, 6);
    expect(r.npsha).toBeCloseTo((101325 - 2339) / (998.2 * 9.81) + 2, 10);
  });

  test('operating point lies on both curves', () => {
    const r = pumpSystem({ Q: 0.005, D: 0.05, L: 100, eps: 0.045e-3, ...water, pv: 2339, sumK: 5, dz: 10, efficiency: 0.7, pumpH0: 60, pumpQmax: 0.01 });
    const { Q, H } = r.operating;
    const sys = r.staticHead + pipeLoss({ Q, D: 0.05, L: 100, eps: 0.045e-3, ...water, sumK: 5 }).hTotal;
    expect(H).toBeCloseTo(sys, 4);
    expect(H).toBeCloseTo(60 * (1 - (Q / 0.01) ** 2), 8);
  });
});

describe('reactor optimisation', () => {
  const p = { type: 'CSTR', Q: 1, k01: 1e6, Ea1: 50, k02: 1e9, Ea2: 75, costV: 100, costT: 10 };

  test('design evaluation: CSTR conversion and parallel selectivity', () => {
    const d = evaluateDesign({ ...p, T: 100, V: 10 });
    const k = d.k1 + d.k2;
    expect(d.X).toBeCloseTo(k * 10 / (1 + k * 10), 12);
    expect(d.S).toBeCloseTo(d.k1 / k, 12);
    expect(d.cost).toBeCloseTo(100 * 10 + 10 * 75, 12);
  });

  test('higher side-reaction activation energy makes selectivity fall with temperature', () => {
    expect(evaluateDesign({ ...p, T: 40, V: 10 }).S).toBeGreaterThan(evaluateDesign({ ...p, T: 160, V: 10 }).S);
  });

  test('optimum is at least as good as every grid sample and respects constraints', () => {
    const r = optimizeReactor({ ...p, objective: 'yield', Tmin: 20, Tmax: 200, Vmin: 1, Vmax: 100, minX: 0.5, minS: 0.7, gridSize: 21 });
    expect(r.feasible).toBe(true);
    expect(r.best.X).toBeGreaterThanOrEqual(0.5 - 1e-9);
    expect(r.best.S).toBeGreaterThanOrEqual(0.7 - 1e-9);
    r.samples.filter(d => d.X >= 0.5 && d.S >= 0.7).forEach(d => expect(r.best.Y).toBeGreaterThanOrEqual(d.Y - 1e-12));
  });

  test('impossible constraints are reported', () => {
    const r = optimizeReactor({ ...p, objective: 'yield', Tmin: 20, Tmax: 30, Vmin: 1, Vmax: 2, minX: 0.99, gridSize: 5 });
    expect(r.feasible).toBe(false);
    expect(r.best).toBeNull();
  });

  test('Pareto front is non-dominated', () => {
    const front = paretoFront([{ X: 0.5, cost: 10 }, { X: 0.4, cost: 12 }, { X: 0.8, cost: 20 }, { X: 0.7, cost: 25 }]);
    expect(front.map(d => d.X)).toEqual([0.5, 0.8]);
  });
});

describe('heat transfer additions', () => {
  test('plane wall: Q = kAΔT/L, linear profile', () => {
    const r = conduction({ geometry: 'wall', k: 0.6, A: 2, L: 0.2, T1: 100, T2: 20, points: 4 });
    expect(r.Q).toBeCloseTo(0.6 * 2 * 80 / 0.2, 10);
    expect(r.profile[2].T).toBeCloseTo(60, 10);
  });

  test('cylinder and sphere resistances', () => {
    const c = conduction({ geometry: 'cylinder', k: 15, L: 1, r1: 0.05, r2: 0.1, T1: 100, T2: 25 });
    expect(c.R).toBeCloseTo(Math.log(2) / (2 * Math.PI * 15), 12);
    const s = conduction({ geometry: 'sphere', k: 15, r1: 0.05, r2: 0.1, T1: 100, T2: 25 });
    expect(s.R).toBeCloseTo((1 / 0.05 - 1 / 0.1) / (4 * Math.PI * 15), 12);
    expect(s.profile[s.profile.length - 1].T).toBeCloseTo(25, 10);
  });

  test('ε-NTU agrees with LMTD for the same exchanger', () => {
    const r = effectivenessNTU({ U: 500, A: 10, Ch: 4000, Cc: 6000, Th_in: 150, Tc_in: 30 });
    expect(r.Q).toBeCloseTo(4000 * (150 - r.Th_out), 6);
    expect(r.Q).toBeCloseTo(6000 * (r.Tc_out - 30), 6);
    const l = calculateHeatTransfer({ U: 500, A: 10, Th_in: 150, Th_out: r.Th_out, Tc_in: 30, Tc_out: r.Tc_out });
    expect(l.Q / r.Q).toBeCloseTo(1, 8);
  });

  test('balanced exchanger (Cr = 1): ε = NTU/(1+NTU)', () => {
    const r = effectivenessNTU({ U: 100, A: 20, Ch: 1000, Cc: 1000, Th_in: 100, Tc_in: 20 });
    expect(r.eps).toBeCloseTo(2 / 3, 10);
  });
});

describe('Thiele effectiveness factor', () => {
  test('η → 1 for small φ and η ≈ 3/φ for large φ', () => {
    expect(effectivenessFromThiele(0)).toBeCloseTo(1, 12);
    expect(effectivenessFromThiele(1e-4)).toBeCloseTo(1, 8);
    expect(effectivenessFromThiele(1)).toBeCloseTo(3 * (1 / Math.tanh(1) - 1), 12);
    expect(effectivenessFromThiele(100)).toBeCloseTo(3 / 100 * (1 - 1 / 100), 6);
  });
});

describe('pinch composite curves', () => {
  const streams = {
    deltaTmin: 20,
    coldStreams: [{ CP: 40, in: 20, out: 160 }, { CP: 60, in: 120, out: 260 }],
    hotStreams: [{ CP: 50, in: 280, out: 60 }, { CP: 30, in: 180, out: 20 }],
  };

  test('duties and energy balance', () => {
    const r = compositeCurves(streams);
    expect(r.hotDuty).toBeCloseTo(50 * 220 + 30 * 160, 9);
    expect(r.coldDuty).toBeCloseTo(40 * 140 + 60 * 140, 9);
    expect(r.hotUtility - r.coldUtility).toBeCloseTo(r.coldDuty - r.hotDuty, 9);
  });

  test('composite curves are separated by at least ΔTmin', () => {
    const r = compositeCurves(streams);
    const interp = (pts, H) => {
      for (let i = 0; i < pts.length - 1; i++) {
        if (H >= pts[i].H - 1e-9 && H <= pts[i + 1].H + 1e-9) {
          const t = (H - pts[i].H) / (pts[i + 1].H - pts[i].H || 1);
          return pts[i].T + t * (pts[i + 1].T - pts[i].T);
        }
      }
      return null;
    };
    const lo = Math.max(r.hot[0].H, r.cold[0].H);
    const hi = Math.min(r.hot[r.hot.length - 1].H, r.cold[r.cold.length - 1].H);
    let minGap = Infinity;
    for (let k = 0; k <= 400; k++) {
      const H = lo + ((hi - lo) * k) / 400;
      minGap = Math.min(minGap, interp(r.hot, H) - interp(r.cold, H));
    }
    expect(minGap).toBeGreaterThanOrEqual(20 - 1e-6);
    expect(minGap).toBeLessThan(20 + 0.5);
  });
});
