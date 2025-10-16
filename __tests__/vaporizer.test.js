const { computeVaporizer } = require('../src/lib/vaporizer');

test('computeVaporizer basic smoke test', () => {
  const inputs = {
    feedFlow: 500,
    vaporFraction: 0.3,
    T_feed_in: -45,
    T_feed_out: -38,
    P_operating: 1.6,
    Pc_mix: 53.57,
    dHvap_mix: 18017,
    Cp_mix: 101.2,
    T_water_in: 50,
    T_water_out: 35,
    k_water: 0.598,
    Cp_water: 4.18,
    rho_water: 1000,
    mu_water: 0.0001,
    tubeLength: 3,
    d0: 0.0254,
    di: 0.0218,
    Rf_o: 0.0005,
    Rf_i: 0.0003,
    k_tube: 14,
    U_initial: 740,
    freeboard: 0.08,
    iterations: 2
  };
  const res = computeVaporizer(inputs);
  expect(res).toHaveProperty('Q_total_kJ_h');
  expect(res).toHaveProperty('iterationResults');
  expect(Array.isArray(res.iterationResults)).toBe(true);
  expect(res.iterationResults.length).toBe(2);
});
