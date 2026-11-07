import { calculateBasicReactor, tauForConversion, conversionAt } from '../src/lib/reactor';
import { calculateReactorss } from '../src/lib/reactorss';
import { computeVaporizer } from '../src/lib/vaporizer';
import { twoSurfaceExchange, graybody, SIGMA } from '../src/lib/radiation';
import { calculateHeatTransfer } from '../src/lib/heattransfer';
import { equilibriumSolve, solveTemperature } from '../src/lib/chemicalSolver';
import { cstrSeries, michaelisSeries, multicomponentSeriesAdvanced } from '../src/lib/dynamics';
import { computeConvection } from '../src/lib/convection';

const base = { flowRate: 10, initialConc: 100, rateConstant: 0.05, targetConversion: 0.8 };

describe('reactor sizing (v0 = F_A0 / C_A0 = 0.1 m³/s)', () => {
  test('first-order PFR: tau = ln(1/(1-X))/k', () => {
    const r = calculateBasicReactor({ ...base, reactorType: 'pfr', reactionOrder: 1 });
    expect(r.spaceTime).toBeCloseTo(Math.log(5) / 0.05, 6);
    expect(r.reactorVolume).toBeCloseTo(0.1 * Math.log(5) / 0.05, 6);
  });

  test('first-order CSTR: tau = X/(k(1-X)) = 80 s', () => {
    const r = calculateBasicReactor({ ...base, reactorType: 'cstr', reactionOrder: 1 });
    expect(r.spaceTime).toBeCloseTo(80, 6);
    expect(r.reactorVolume).toBeCloseTo(8, 6);
  });

  test('zero order: PFR and CSTR need the same volume (tau = C0·X/k)', () => {
    const pfr = calculateBasicReactor({ ...base, reactorType: 'pfr', reactionOrder: 0 });
    const cstr = calculateBasicReactor({ ...base, reactorType: 'cstr', reactionOrder: 0 });
    expect(pfr.spaceTime).toBeCloseTo(1600, 6);
    expect(cstr.spaceTime).toBeCloseTo(1600, 6);
    expect(pfr.reactorVolume).toBeCloseTo(160, 6);
  });

  test('zero-order batch time = C0·X/k', () => {
    const r = calculateBasicReactor({ ...base, reactorType: 'batch', reactionOrder: 0 });
    expect(r.batchTime).toBeCloseTo(1600, 6);
    expect(r.reactorVolume).toBeNull();
  });

  test('second-order CSTR: tau = X/(k·C0·(1-X)²)', () => {
    const r = calculateBasicReactor({ ...base, rateConstant: 0.001, reactorType: 'cstr', reactionOrder: 2 });
    expect(r.spaceTime).toBeCloseTo(200, 6);
  });

  test('PBR uses k = k′·η·ρb and reports catalyst weight', () => {
    const r = calculateBasicReactor({
      ...base, reactorType: 'pbr', reactionOrder: 1,
      effectiveRateConstant: 1e-4, effectivenessFactor: 0.5, catDensity: 1000,
    });
    expect(r.spaceTime).toBeCloseTo(Math.log(5) / 0.05, 6);
    expect(r.catalystWeight).toBeCloseTo(r.reactorVolume * 1000, 6);
  });

  test.each([
    ['plug', 0], ['plug', 1], ['plug', 2], ['mixed', 0], ['mixed', 1], ['mixed', 2],
  ])('conversionAt inverts tauForConversion (%s, n=%i)', (kind, order) => {
    for (const X of [0.1, 0.5, 0.9, 0.99]) {
      const tau = tauForConversion(kind, order, 0.02, 3, X);
      expect(conversionAt(kind, order, 0.02, 3, tau)).toBeCloseTo(X, 9);
    }
  });

  test('profiles end exactly at the target conversion', () => {
    for (const reactorType of ['pfr', 'cstr', 'batch', 'pbr']) {
      for (const reactionOrder of [0, 1, 2]) {
        const r = calculateBasicReactor({ ...base, rateConstant: 0.01, reactorType, reactionOrder });
        const last = r.conversionProfile[r.conversionProfile.length - 1];
        expect(last.y).toBeCloseTo(0.8, 9);
      }
    }
  });

  test('selectivity is an input and yield = X·S', () => {
    const r = calculateBasicReactor({ ...base, reactorType: 'pfr', reactionOrder: 1, selectivity: 0.9 });
    expect(r.yield).toBeCloseTo(0.72, 12);
    expect(() => calculateBasicReactor({ ...base, reactorType: 'pfr', reactionOrder: 1, selectivity: 1.5 })).toThrow();
  });

  test('invalid conversion throws', () => {
    expect(() => calculateBasicReactor({ ...base, targetConversion: 1, reactorType: 'pfr', reactionOrder: 1 })).toThrow();
  });
});

describe('customizable gas-phase PBR', () => {
  const inputs = {
    prodName: 'Allyl Klorür', prodMolarMass: 76.5, prodStoich: 1, coprodStoich: 1,
    reactAName: 'Propylene', reactAStoich: 1, reactBName: 'Chlorine', reactBStoich: 1,
    conversion: 0.3, annualProd: 90000, opHours: 7200, reactionTemp: 783, P_total: 3,
    k0: 0.0322, E: 63.2, orderLim: 1, orderExc: 1, feedRatio: 5, limiting: 'A',
  };

  test('equimolar reaction keeps total moles constant', () => {
    const r = calculateReactorss(inputs);
    expect(r._diag.delta).toBe(0);
    const last = r.concLim.length - 1;
    expect(r.concLim[0]).toBeCloseTo(1 / 6, 12);
    expect(r.concLim[last]).toBeCloseTo(0.7 / 6, 12);
    expect(r.concExc[last]).toBeCloseTo(4.7 / 6, 12);
  });

  test('W matches the analytic integral for first order in each reactant', () => {
    // r = k_h P² yL yE with constant total moles; ∫ dX / ((1-X)(r0-X)) = ln[(r0-X)/(r0(1-X))]/(r0-1)
    const r = calculateReactorss(inputs);
    const ratio = 5;
    const X = 0.3;
    const integral = Math.log((ratio - X) / (ratio * (1 - X))) / (ratio - 1);
    const expected = r.F0_lim * 36 / (r._diag.k_h * 9) * integral;
    expect(r.W / expected).toBeCloseTo(1, 5);
  });

  test('choosing B as limiting gives the same result as swapping A and B', () => {
    const a = calculateReactorss({ ...inputs, reactAStoich: 1, reactBStoich: 2 });
    const b = calculateReactorss({ ...inputs, reactAStoich: 2, reactBStoich: 1, limiting: 'B' });
    expect(b.W).toBeCloseTo(a.W, 9);
    expect(b.concExc_kmolh[b.concExc_kmolh.length - 1]).toBeCloseTo(a.concExc_kmolh[a.concExc_kmolh.length - 1], 9);
  });

  test('product moles are counted (A + B -> P changes total moles)', () => {
    const r = calculateReactorss({ ...inputs, coprodStoich: 0 });
    expect(r._diag.delta).toBe(-1);
    expect(r.concLim[r.concLim.length - 1]).toBeCloseTo(0.7 / (6 - 0.3), 12);
  });

  test('activation energy in J/mol is rejected instead of silently reinterpreted', () => {
    expect(() => calculateReactorss({ ...inputs, E: 63200 })).toThrow();
  });
});

describe('vaporizer', () => {
  const inputs = {
    feedFlow: 503.32, vaporFraction: 0.3, T_feed_in: -45.3, T_feed_out: -37.9, P_operating: 1.6,
    Pc_mix: 53.57, dHvap_mix: 18017, Cp_mix: 101.2, T_water_in: 50, T_water_out: 35,
    k_water: 0.598, Cp_water: 4.18, rho_water: 1000, mu_water: 0.0001, tubeLength: 3,
    d0: 0.0254, di: 0.0218, Rf_o: 0.0005, Rf_i: 0.0003, k_tube: 14, U_initial: 740,
    freeboard: 0.08, iterations: 5,
  };

  test('bundle diameter uses Db = d0·(Nt/K1)^(1/n1)', () => {
    const r = computeVaporizer(inputs);
    const Nt = r.iterationResults[r.iterationResults.length - 1].N_tubes;
    expect(r.Db).toBeCloseTo(inputs.d0 * Math.pow(Nt / 0.249, 1 / 2.207), 12);
  });

  test('counter-current LMTD', () => {
    const r = computeVaporizer(inputs);
    const dT1 = 50 - (-37.9);
    const dT2 = 35 - (-45.3);
    expect(r.LMTD).toBeCloseTo((dT1 - dT2) / Math.log(dT1 / dT2), 9);
  });

  test('temperature cross throws', () => {
    expect(() => computeVaporizer({ ...inputs, T_water_in: -40 })).toThrow();
  });
});

describe('radiation', () => {
  test('large parallel plates: q = σ(T1⁴−T2⁴)/(1/ε1 + 1/ε2 − 1)', () => {
    const { Q } = twoSurfaceExchange({ T1: 800, A1: 1, eps1: 0.8, T2: 300, A2: 1, eps2: 0.6, F12: 1 });
    expect(Q).toBeCloseTo(SIGMA * (800 ** 4 - 300 ** 4) / (1 / 0.8 + 1 / 0.6 - 1), 6);
  });

  test('black surfaces reduce to σ·A1·F12·(T1⁴−T2⁴)', () => {
    const { Q } = twoSurfaceExchange({ T1: 600, A1: 2, eps1: 1, T2: 300, A2: 5, eps2: 1, F12: 0.4 });
    expect(Q).toBeCloseTo(SIGMA * 2 * 0.4 * (600 ** 4 - 300 ** 4), 6);
  });

  test('emissivity outside (0,1] throws', () => {
    expect(() => graybody({ T: 400, A: 1, epsilon: 1.2, T_surroundings: 300 })).toThrow();
  });
});

describe('counter-current heat exchanger', () => {
  test('LMTD and profile end points', () => {
    const r = calculateHeatTransfer({ U: 500, A: 10, Th_in: 150, Th_out: 100, Tc_in: 30, Tc_out: 60, points: 40 });
    expect(r.LMTD).toBeCloseTo(20 / Math.log(90 / 70), 9);
    expect(r.Q).toBeCloseTo(500 * 10 * r.LMTD, 6);
    const n = r.profiles.x.length - 1;
    expect(r.profiles.Th[0]).toBeCloseTo(150, 9);
    expect(r.profiles.Tc[0]).toBeCloseTo(60, 9);
    expect(r.profiles.Th[n]).toBeCloseTo(100, 9);
    expect(r.profiles.Tc[n]).toBeCloseTo(30, 9);
  });

  test('equal terminal differences', () => {
    const r = calculateHeatTransfer({ Th_in: 150, Th_out: 100, Tc_in: 30, Tc_out: 80 });
    expect(r.LMTD).toBeCloseTo(70, 9);
  });

  test('temperature cross is reported, not hidden', () => {
    const r = calculateHeatTransfer({ Th_in: 100, Th_out: 60, Tc_in: 30, Tc_out: 110 });
    expect(r.error).toBeTruthy();
    expect(Number.isNaN(r.Q)).toBe(true);
  });
});

describe('chemical equilibrium', () => {
  test('A <=> C forward, K = 4', () => {
    const r = equilibriumSolve({ coefA: 1, coefC: 1, concA: 1, concC: 0, equilibriumConstant: 4 });
    expect(r.x).toBeCloseTo(0.8, 9);
  });

  test('A <=> C proceeds in reverse when only product is present', () => {
    const r = equilibriumSolve({ coefA: 1, coefC: 1, concA: 0, concC: 1, equilibriumConstant: 4 });
    expect(r.x).toBeCloseTo(-0.2, 9);
    expect(r.eqA).toBeCloseTo(0.2, 9);
    expect(r.eqC).toBeCloseTo(0.8, 9);
  });

  test('A + B <=> C + D satisfies K', () => {
    const r = equilibriumSolve({ coefA: 1, coefB: 1, coefC: 1, coefD: 1, concA: 1, concB: 2, concC: 0.5, concD: 0, equilibriumConstant: 0.3 });
    expect(r.Kcalc).toBeCloseTo(0.3, 9);
    expect((r.eqC * r.eqD) / (r.eqA * r.eqB)).toBeCloseTo(0.3, 9);
  });

  test('temperature from ΔH°, ΔS°, K', () => {
    // ln K = 0 -> T = ΔH/ΔS = -50000 / -100
    expect(solveTemperature({ deltaH0: -50, deltaS0: -100, equilibriumConstant: 1 })).toBeCloseTo(500, 9);
    expect(() => solveTemperature({ deltaH0: -50, deltaS0: 100, equilibriumConstant: 1 })).toThrow();
  });
});

describe('dynamics', () => {
  test('CSTR start-up approaches C0/(1+kτ)', () => {
    const s = cstrSeries({ C0: 1, k: 0.1, tau: 40, simTime: 500, points: 11 });
    expect(s[s.length - 1].C).toBeCloseTo(1 / 5, 6);
  });

  test('CSTR is stable with coarse plotting steps', () => {
    const s = cstrSeries({ C0: 1, k: 5, tau: 1, simTime: 100, points: 5 });
    s.forEach(p => expect(p.C).toBeGreaterThanOrEqual(0));
  });

  test('Michaelis-Menten matches the implicit analytic solution', () => {
    const Vmax = 1, Km = 0.5, S0 = 2;
    const s = michaelisSeries({ Vmax, Km, S0, simTime: 2, points: 3 });
    const { t, S } = s[s.length - 1];
    expect(Km * Math.log(S0 / S) + (S0 - S)).toBeCloseTo(Vmax * t, 6);
  });

  test('A -> B -> C intermediate peaks at ln(kA/kB)/(kA-kB)', () => {
    const kA = 0.2, kB = 0.05;
    const tMax = Math.log(kA / kB) / (kA - kB);
    const s = multicomponentSeriesAdvanced({ C0: 1, kA, kB, simTime: tMax, points: 2 });
    const expected = (kA / (kB - kA)) * (Math.exp(-kA * tMax) - Math.exp(-kB * tMax));
    expect(s[1].B).toBeCloseTo(expected, 12);
    expect(s[1].A).toBeCloseTo(Math.exp(-kA * tMax), 12);
  });
});

describe('convection', () => {
  test('laminar flat plate: Nu = 0.664·Re^½·Pr^⅓', () => {
    const r = computeConvection({ type: 'forced-flat', geometry: { L: 0.5, V: 2 } });
    expect(r.regime).toBe('laminar');
    expect(r.Nu).toBeCloseTo(0.664 * Math.sqrt(r.ReL) * Math.cbrt(r.Pr), 9);
  });

  test('laminar tube flow uses Nu = 3.66', () => {
    const r = computeConvection({ type: 'forced-tube', geometry: { D: 0.01, V: 0.5 } });
    expect(r.Re).toBeLessThan(2300);
    expect(r.Nu).toBeCloseTo(3.66, 12);
  });

  test('natural convection uses the given temperatures', () => {
    const r = computeConvection({ type: 'natural-vertical', geometry: { L: 1, Ts: 80, Tinf: 20 } });
    expect(Number.isFinite(r.h)).toBe(true);
    expect(r.h).toBeGreaterThan(2);
    expect(r.h).toBeLessThan(10);
  });
});
