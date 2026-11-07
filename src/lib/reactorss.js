// Calculation utilities for the customizable (gas-phase, packed-bed) reactor page.
//
// Reaction:  a A + b B -> c P + d D      (D = optional co-product, e.g. HCl)
// Rate (per kg catalyst, of the limiting reactant):
//   -r'_lim = k * P_lim^n_lim * P_exc^n_exc,  k = k0 * exp(-E / (R T))
// Design equation (PBR):  W = F_lim0 * ∫0^X dX / (-r'_lim)
//
// Units: annualProd [ton/yr], prodMolarMass [kg/kmol], opHours [h/yr], P_total [atm],
//        k0 [kmol/(kg_cat·s·atm^n)], E [kJ/mol], T [K]  ->  flows [kmol/h], W [kg]

const R = 8.314; // J/(mol K)

function requirePositive(value, message) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) throw new Error(message);
  return n;
}

export function calculateReactorss(inputs) {
  const {
    prodName,
    limiting = 'A',
    orderLim = 1,
    orderExc = 1,
    coprodStoich = 0,
  } = inputs;

  const prodMolarMass = requirePositive(inputs.prodMolarMass, 'Ürün molar kütlesi (>0) girin.');
  const prodStoich = requirePositive(inputs.prodStoich, 'Ürün stoikiometrik katsayısı (>0) girin.');
  const reactAStoich = requirePositive(inputs.reactAStoich, 'A stoikiometrik katsayısı (>0) girin.');
  const reactBStoich = requirePositive(inputs.reactBStoich, 'B stoikiometrik katsayısı (>0) girin.');
  const annualProd = requirePositive(inputs.annualProd, 'Yıllık üretim (>0) girin.');
  const opHours = requirePositive(inputs.opHours, 'Yıllık çalışma saati (>0) girin.');
  const reactionTemp = requirePositive(inputs.reactionTemp, 'Reaksiyon sıcaklığı (K, >0) girin.');
  const P_total = requirePositive(inputs.P_total, 'Toplam basınç (>0) girin.');
  const k0 = requirePositive(inputs.k0, 'Ön faktör k₀ (>0) girin.');
  const feedRatio = requirePositive(inputs.feedRatio, 'Besleme oranı (>0) girin.');
  const conversion = Number(inputs.conversion);
  if (!isFinite(conversion) || conversion <= 0 || conversion >= 1) {
    throw new Error('Dönüşüm 0 < X < 1 aralığında olmalıdır.');
  }
  const E_kJ = Number(inputs.E);
  if (!isFinite(E_kJ) || E_kJ < 0) throw new Error('Aktivasyon enerjisi (≥0, kJ/mol) girin.');
  if (E_kJ > 1000) {
    throw new Error('Aktivasyon enerjisi kJ/mol cinsinden girilmelidir (ör. 63200 J/mol yerine 63.2).');
  }
  const d = Number(coprodStoich) || 0;
  if (d < 0) throw new Error('Yan ürün stoikiometrik katsayısı negatif olamaz.');

  // Stoichiometric coefficients of limiting / excess reactant
  const aLim = limiting === 'A' ? reactAStoich : reactBStoich;
  const aExc = limiting === 'A' ? reactBStoich : reactAStoich;
  const excPerLim = aExc / aLim; // mol excess consumed per mol limiting reacted

  if (feedRatio - excPerLim * conversion <= 0) {
    throw new Error('Besleme oranı bu dönüşüm için yetersiz: fazla reaktan tükeniyor. Oranı artırın veya limitleyici reaktanı değiştirin.');
  }

  // Production: ton/yr -> kmol/h of product
  const prodKmolH = (annualProd * 1000) / prodMolarMass / opHours;
  const F0_lim = (prodKmolH * (aLim / prodStoich)) / conversion; // kmol/h
  const F0_exc = F0_lim * feedRatio;

  // Arrhenius
  const k_val = k0 * Math.exp(-(E_kJ * 1000) / (R * reactionTemp)); // per second
  const k_h = k_val * 3600; // per hour

  // Mole change per mol limiting reacted (products minus reactants), basis 1 mol limiting fed
  const delta = (prodStoich + d - aLim - aExc) / aLim;

  function composition(X) {
    const nLim = 1 - X;
    const nExc = feedRatio - excPerLim * X;
    const nTot = 1 + feedRatio + delta * X;
    return { yLim: nLim / nTot, yExc: nExc / nTot };
  }

  function reactionRate(X) {
    const { yLim, yExc } = composition(X);
    const P_lim = Math.max(1e-12, yLim * P_total);
    const P_exc = Math.max(1e-12, yExc * P_total);
    return k_h * Math.pow(P_lim, orderLim) * Math.pow(P_exc, orderExc); // kmol/(kg·h)
  }

  // Trapezoidal integration of F_lim0 / r' over conversion
  const N = 400;
  const dX = conversion / N;
  let integral = 0;
  const Xpoints = [];
  const rpoints = [];
  const concLim = [];
  const concExc = [];
  const concLim_kmolh = [];
  const concExc_kmolh = [];

  for (let i = 0; i <= N; i++) {
    const X_val = i * dX;
    const r_val = reactionRate(X_val);
    const f = F0_lim / r_val;
    const { yLim, yExc } = composition(X_val);

    Xpoints.push(X_val);
    rpoints.push(r_val);
    concLim.push(yLim);
    concExc.push(yExc);
    concLim_kmolh.push(F0_lim * (1 - X_val));
    concExc_kmolh.push(F0_exc - excPerLim * F0_lim * X_val);

    integral += (i === 0 || i === N) ? f : 2 * f;
  }
  integral = (dX / 2) * integral;
  const W = integral;

  const rMin = Math.min(...rpoints);
  const rMax = Math.max(...rpoints);
  const warning = W > 5000 ? 'Hesaplanan W çok büyük (>5.000 kg). k₀ birimini/büyüklüğünü ve E (kJ/mol) değerini kontrol edin.' : null;

  return {
    prodName,
    prodKmolH,
    F0_lim,
    F0_exc,
    W,
    Xpoints,
    rpoints,
    concLim,
    concExc,
    concLim_kmolh,
    concExc_kmolh,
    _diag: { rMin, rMax, integral, k_val, k_h, delta, warning },
  };
}
