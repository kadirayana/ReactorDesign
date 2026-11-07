import React, { useState } from 'react';
import Head from 'next/head';
import ChartClient from '../components/ChartClient';
import TabButton from '../components/TabButton';
import ReactorDiagram from '../components/ReactorDiagram';
import { calculateBasicReactor, rateConstantUnits, catalystRateConstantUnits } from '../src/lib/reactor';
import { downloadCSV } from '../src/lib/utils';



export default function ReactorPage() {
  const [tab, setTab] = useState('basic');
  return (
    <>
      <Head>
        <title>Reaktör Tasarımı - Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="description" content="PFR, CSTR, PBR ve Batch reaktör tasarımı, görselleştirme ve ekonomik analiz araçları." />
      </Head>
      <div className="page-container">
        <h1 className="page-title">Reaktör Tasarım ve Görselleştirme</h1>
        <div className="tabs">
          <TabButton active={tab === 'basic'} onClick={() => setTab('basic')}>Temel Tasarım</TabButton>
          <TabButton active={tab === 'advanced'} onClick={() => setTab('advanced')}>Gelişmiş Tasarım</TabButton>
          <TabButton active={tab === 'economic'} onClick={() => setTab('economic')}>Ekonomik Analiz</TabButton>
        </div>
        <div className="content-card">
          {tab === 'basic' && <BasicReactorCalculator />}
          {tab === 'advanced' && <AdvancedReactorCalculator />}
          {tab === 'economic' && <EconomicAnalysisStub />}
        </div>
      </div>
    </>
  );
}

function BasicReactorCalculator() {
  const [inputs, setInputs] = useState({
    reactorType: 'pfr',
    reactionOrder: 1,
    flowRate: 10,
    initialConc: 100,
    rateConstant: 0.05,
    targetConversion: 0.8,
    selectivity: 1
  });
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: isNaN(value) ? value : Number(value) }));
  }

  function runCalc() {
    setCalcError('');
    try {
      setResult(calculateBasicReactor(inputs));
    } catch (err) {
      setResult(null);
      setCalcError(err.message);
    }
  }

  function handleDownloadBasic(res) {
    if (!res) return;
    const headers = [res.profileAxis, 'conversion', 'concA [mol/m3]'];
    const conv = res.conversionProfile || [];
    const conc = res.concentrationProfile || [];
    const rows = conv.map((p, i) => [p.x, p.y, (conc[i] && conc[i].y) || '']);
    downloadCSV('basic_reactor_profile.csv', headers, rows);
  }

  return (
    <div>
      <h3>Temel Reaktör Parametreleri</h3>
      <label>Reaktör Tipi:
        <select name="reactorType" value={inputs.reactorType} onChange={handleChange}>
          <option value="pfr">Plug Flow Reactor (PFR)</option>
          <option value="cstr">Continuous Stirred Tank Reactor (CSTR)</option>
          <option value="pbr">Packed Bed Reactor (PBR)</option>
          <option value="batch">Batch Reactor</option>
        </select>
      </label>
      <label>Reaksiyon Derecesi:
        <select name="reactionOrder" value={inputs.reactionOrder} onChange={handleChange}>
          <option value={0}>Sıfırıncı Derece</option>
          <option value={1}>Birinci Derece</option>
          <option value={2}>İkinci Derece</option>
        </select>
      </label>
      <label>Mol Akış Hızı, Fₐ₀ [mol/s]:
        <input name="flowRate" value={inputs.flowRate} onChange={handleChange} />
      </label>
      <label>Başlangıç Konsantrasyonu, Cₐ₀ [mol/m³]:
        <input name="initialConc" value={inputs.initialConc} onChange={handleChange} />
      </label>
      <label>Hız Sabiti, k [{rateConstantUnits(Number(inputs.reactionOrder))}]:
        <input name="rateConstant" value={inputs.rateConstant} onChange={handleChange} />
      </label>
      <label>Hedef Dönüşüm, X (0 &lt; X &lt; 1):
        <input name="targetConversion" value={inputs.targetConversion} onChange={handleChange} />
      </label>
      <label>Seçicilik, S (0–1, tek reaksiyon için 1):
        <input name="selectivity" value={inputs.selectivity} onChange={handleChange} />
      </label>
      <div style={{ marginTop: 12 }}>
        <button onClick={runCalc}>Hesapla ve Görselleştir</button>
      </div>
      {calcError && <p className="error" style={{ color: '#c0392b' }}>{calcError}</p>}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Sonuçlar</h3>
          {result.batchTime != null ? (
            <p>Gerekli reaksiyon süresi: {result.batchTime.toFixed(3)} s</p>
          ) : (
            <>
              <p>Reaktör hacmi: {result.reactorVolume.toFixed(4)} m³</p>
              <p>Uzay zamanı (τ): {result.spaceTime.toFixed(3)} s</p>
              {result.catalystWeight != null && <p>Katalizör kütlesi: {result.catalystWeight.toFixed(2)} kg</p>}
            </>
          )}
          <p>Seçicilik: {result.selectivity}</p>
          <p>Verim: {result.yield.toFixed(4)}</p>
          <h4>Dönüşüm Profili ({result.profileAxis})</h4>
          <ChartClient
            type="line"
            data={{
              labels: result.conversionProfile.map(p => Number(p.x.toPrecision(4))),
              datasets: [
                {
                  label: 'Dönüşüm',
                  data: result.conversionProfile.map(p => p.y),
                  borderColor: '#007bff',
                  fill: false
                },
                {
                  label: 'Konsantrasyon A',
                  data: (result.concentrationProfile || result.concentrationA || []).map(p => p.y),
                  borderColor: '#28a745',
                  fill: false
                }
              ]
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={() => handleDownloadBasic(result)}>CSV İndir</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdvancedReactorCalculator() {
  const [inputs, setInputs] = useState({
    reactorType: 'pfr',
    reactionOrder: 1,
    kineticEquation: '',
    inhibitionConstant: 0,
    flowRate: 10,
    initialConc: 100,
    rateConstant: 0.05,
    catDensity: 1000,
    effectiveRateConstant: 0.1,
    effectivenessFactor: 0.8,
    targetConversion: 0.8,
    selectivity: 1,
    reactionType: 'irreversible',
    reactionTemp: 350,
    reactionPressure: 2,
    activationEnergy: 80,
    heatOfReaction: -50,
    externalDiffusion: false,
    internalDiffusion: false,
    thieleMod: 1.0,
    operatingMode: 'isothermal',
    coolingMethod: 'jacket',
    heatTransferCoeff: 500,
  });
  // local component state for results, charts and UI toggles
  const [result, setResult] = useState(null);
  const [chartTab, setChartTab] = useState('conversion');
  const [showCatParams, setShowCatParams] = useState(inputs.reactorType === 'pbr');
  const [showCustomKinetics, setShowCustomKinetics] = useState(inputs.reactionOrder === 'custom');
  const [coolingEnabled, setCoolingEnabled] = useState(inputs.operatingMode === 'nonisothermal');
  const [thieleEnabled, setThieleEnabled] = useState(inputs.internalDiffusion === true);
  const [calcError, setCalcError] = useState('');
  const [showConversionSeries, setShowConversionSeries] = useState(true);
  const [showConcSeries, setShowConcSeries] = useState(true);
  const [showTempSeries, setShowTempSeries] = useState(true);
  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setInputs(i => ({ ...i, [name]: checked }));
    } else {
      setInputs(i => ({ ...i, [name]: isNaN(value) ? value : Number(value) }));
    }
  }

  // Keep UI toggles in sync when inputs change
  // useEffect not imported at top, but useState/useEffect available from React via same import
  // We'll create local effects below

  // show/hide catalyst params when reactor type changes
  React.useEffect(() => {
    setShowCatParams(inputs.reactorType === 'pbr');
  }, [inputs.reactorType]);

  // show custom kinetics when reactionOrder === 'custom'
  React.useEffect(() => {
    setShowCustomKinetics(inputs.reactionOrder === 'custom');
  }, [inputs.reactionOrder]);

  // enable cooling fields when nonisothermal
  React.useEffect(() => {
    setCoolingEnabled(inputs.operatingMode === 'nonisothermal');
  }, [inputs.operatingMode]);

  // enable thiele when internalDiffusion checked
  React.useEffect(() => {
    setThieleEnabled(Boolean(inputs.internalDiffusion));
  }, [inputs.internalDiffusion]);

  function runCalc() {
    setCalcError('');
    // Sizing and conversion profile come from the shared library (src/lib/reactor.js)
    const order = inputs.reactionOrder === 'custom' ? 1 : Number(inputs.reactionOrder);
    let base;
    try {
      base = calculateBasicReactor({ ...inputs, reactionOrder: order });
    } catch (err) {
      setCalcError(err.message);
      setResult(null);
      return;
    }

    const ca0 = Number(inputs.initialConc);
    const initialTemp = Number(inputs.reactionTemp) || 350;
    const heatOfRxn = Number(inputs.heatOfReaction) || -50; // kJ/mol
    // Adiabatic temperature rise per unit conversion (liquid-like: cp = 4.2 kJ/(kg·K), rho = 1000 kg/m³)
    const dTadPerX = -heatOfRxn * ca0 / (4.2 * 1000);
    // Simplified non-isothermal case: cooling removes a fixed 70 % of the generated heat
    const coolingEfficiency = 0.7;

    const zProfile = base.conversionProfile.map(p => Number(p.x.toPrecision(4)));
    const convProfile = base.conversionProfile.map(p => p.y);
    const tempProfile = base.conversionProfile.map(p => {
      let temperature = initialTemp;
      if (inputs.operatingMode === 'adiabatic') temperature = initialTemp + dTadPerX * p.y;
      else if (inputs.operatingMode === 'nonisothermal') temperature = initialTemp + dTadPerX * p.y * (1 - coolingEfficiency);
      return { position: p.x, temperature };
    });

    setResult({
      reactorVolume: base.reactorVolume,
      batchTime: base.batchTime,
      spaceTime: base.spaceTime,
      catalystWeight: base.catalystWeight,
      selectivity: base.selectivity,
      yield: base.yield,
      profileAxis: base.profileAxis,
      reactionTemp: initialTemp,
      initialConc: ca0,
      flowRate: Number(inputs.flowRate),
      rateConstant: base.k,
      activationEnergy: inputs.activationEnergy,
      heatOfReaction: inputs.heatOfReaction,
      targetConversion: Number(inputs.targetConversion),
      operatingMode: inputs.operatingMode,
      finalT: tempProfile[tempProfile.length - 1].temperature,
      finalX: convProfile[convProfile.length - 1],
      zProfile,
      tempProfile,
      convProfile,
    });
  }



  function handleDownloadAdvanced(res) {
    if (!res) return;
    const headers = ['position', 'conversion', 'temperature'];
    const z = res.zProfile || [];
    const conv = res.convProfile || [];
    const temp = res.tempProfile || [];
    const rows = z.map((pos, i) => [pos, conv[i] || '', (temp[i] && temp[i].temperature) || '']);
    downloadCSV('advanced_reactor_profile.csv', headers, rows);
  }


  return (
    <div>
      <form onSubmit={e => { e.preventDefault(); runCalc(); }}>
        <h3>Gelişmiş Reaktör Parametreleri</h3>
        <label>Reaktör Tipi:
          <select name="reactorType" value={inputs.reactorType} onChange={handleChange}>
            <option value="pfr">Plug Flow Reactor (PFR)</option>
            <option value="cstr">Continuous Stirred Tank Reactor (CSTR)</option>
            <option value="pbr">Packed Bed Reactor (PBR)</option>
            <option value="batch">Batch Reactor</option>
          </select>
        </label>
        <label>Reaksiyon Derecesi:
          <select name="reactionOrder" value={inputs.reactionOrder} onChange={handleChange}>
            <option value={0}>Sıfırıncı Derece</option>
            <option value={1}>Birinci Derece</option>
            <option value={2}>İkinci Derece</option>
            <option value="custom">Özel Kinetik</option>
          </select>
        </label>
        {inputs.reactionOrder === 'custom' && (
          <>
            <label>Kinetik Denklem:
              <input name="kineticEquation" value={inputs.kineticEquation} onChange={handleChange} placeholder="k*CA*CB/(1+K*CA)" />
            </label>
            <label>İnhibisyon Sabiti (K):
              <input name="inhibitionConstant" value={inputs.inhibitionConstant} onChange={handleChange} />
            </label>
          </>
        )}
        {inputs.reactorType === 'pbr' && (
          <>
            <label>Katalizör Yoğunluğu [kg/m³]:
              <input name="catDensity" value={inputs.catDensity} onChange={handleChange} />
            </label>
            <label>Katalizöre Özgü Hız Sabiti, k′ [{catalystRateConstantUnits(Number(inputs.reactionOrder === 'custom' ? 1 : inputs.reactionOrder))}]:
              <input name="effectiveRateConstant" value={inputs.effectiveRateConstant} onChange={handleChange} />
            </label>
            <label>Etkinlik Faktörü (η):
              <input name="effectivenessFactor" value={inputs.effectivenessFactor} onChange={handleChange} />
            </label>
          </>
        )}
        <label>Mol Akış Hızı, Fₐ₀ [mol/s]:
          <input name="flowRate" value={inputs.flowRate} onChange={handleChange} />
        </label>
        <label>Başlangıç Konsantrasyonu, Cₐ₀ [mol/m³]:
          <input name="initialConc" value={inputs.initialConc} onChange={handleChange} />
        </label>
        <label>Hız Sabiti, k [{rateConstantUnits(Number(inputs.reactionOrder === 'custom' ? 1 : inputs.reactionOrder))}]:
          <input name="rateConstant" value={inputs.rateConstant} onChange={handleChange} />
        </label>
        <label>Hedef Dönüşüm, X (0 &lt; X &lt; 1):
          <input name="targetConversion" value={inputs.targetConversion} onChange={handleChange} />
        </label>
        <label>Seçicilik, S (0–1, tek reaksiyon için 1):
          <input name="selectivity" value={inputs.selectivity} onChange={handleChange} />
        </label>
        <label>Reaksiyon Tipi:
          <select name="reactionType" value={inputs.reactionType} onChange={handleChange}>
            <option value="irreversible">Tersinmez (A → B)</option>
            <option value="reversible">Tersinir (A ⇌ B)</option>
            <option value="parallel">Paralel (A → B, A → C)</option>
            <option value="series">Seri (A → B → C)</option>
          </select>
        </label>
        <label>Reaksiyon Sıcaklığı [K]:
          <input name="reactionTemp" value={inputs.reactionTemp} onChange={handleChange} />
        </label>
        <label>Reaksiyon Basıncı [bar]:
          <input name="reactionPressure" value={inputs.reactionPressure} onChange={handleChange} />
        </label>
        <label>Aktivasyon Enerjisi [kJ/mol]:
          <input name="activationEnergy" value={inputs.activationEnergy} onChange={handleChange} />
        </label>
        <label>Reaksiyon Isısı [kJ/mol]:
          <input name="heatOfReaction" value={inputs.heatOfReaction} onChange={handleChange} />
        </label>
        <label>Dış Difüzyon Direnci Dahil:
          <input type="checkbox" name="externalDiffusion" checked={inputs.externalDiffusion} onChange={handleChange} />
        </label>
        <label>İç Difüzyon Direnci Dahil:
          <input type="checkbox" name="internalDiffusion" checked={inputs.internalDiffusion} onChange={handleChange} />
        </label>
        <label>Thiele Modülü:
          <input name="thieleMod" value={inputs.thieleMod} onChange={handleChange} disabled={!inputs.internalDiffusion} />
        </label>
        <label>Çalışma Modu:
          <select name="operatingMode" value={inputs.operatingMode} onChange={handleChange}>
            <option value="isothermal">İzotermal</option>
            <option value="adiabatic">Adyabatik</option>
            <option value="nonisothermal">İzotermal Olmayan</option>
          </select>
        </label>
        <label>Soğutma Metodu:
          <select name="coolingMethod" value={inputs.coolingMethod} onChange={handleChange} disabled={inputs.operatingMode !== 'nonisothermal'}>
            <option value="jacket">Ceket</option>
            <option value="coil">Sarmal Boru</option>
            <option value="exchanger">Isı Değiştirici</option>
          </select>
        </label>
        <label>Isı Transfer Katsayısı [W/(m²·K)]:
          <input name="heatTransferCoeff" value={inputs.heatTransferCoeff} onChange={handleChange} disabled={inputs.operatingMode !== 'nonisothermal'} />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Gelişmiş Hesaplama</button>
        </div>
      </form>

      {calcError && <p className="error" style={{ color: '#c0392b' }}>{calcError}</p>}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Sonuçlar</h3>

          <div id="reactorPerformance">
            <h4>Performans Parametreleri</h4>
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Parametre</th>
                  <th>Değer</th>
                  <th>Birim</th>
                </tr>
              </thead>
              <tbody>
                {result.batchTime != null ? (
                  <tr>
                    <td>Reaksiyon Süresi</td>
                    <td>{result.batchTime.toFixed(3)}</td>
                    <td>s</td>
                  </tr>
                ) : (
                  <tr>
                    <td>Reaktör Hacmi</td>
                    <td>{result.reactorVolume.toFixed(4)}</td>
                    <td>m³</td>
                  </tr>
                )}
                {result.catalystWeight != null && (
                  <tr>
                    <td>Katalizör Kütlesi</td>
                    <td>{result.catalystWeight.toFixed(2)}</td>
                    <td>kg</td>
                  </tr>
                )}
                <tr>
                  <td>Uzay Zamanı</td>
                  <td>{result.spaceTime ? result.spaceTime.toFixed(3) : '-'}</td>
                  <td>s</td>
                </tr>
                <tr>
                  <td>Uzay Hızı</td>
                  <td>{result.spaceTime ? (1 / result.spaceTime).toFixed(4) : '-'}</td>
                  <td>1/s</td>
                </tr>
                <tr>
                  <td>Dönüşüm</td>
                  <td>{(result.targetConversion * 1).toString()}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Seçicilik</td>
                  <td>{result.selectivity}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Verim</td>
                  <td>{result.yield.toFixed(4)}</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="reactorDiagram" className="card" style={{ textAlign: 'center' }}>
            <h4>Reaktör Şeması</h4>
            <ReactorDiagram reactorType={inputs.reactorType} />
          </div>

          <h4 style={{ marginTop: 20 }}>Performans Grafikleri</h4>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 8 }}>
            <button className={chartTab === 'conversion' ? 'active' : ''} onClick={() => setChartTab('conversion')}>Dönüşüm</button>
            <button className={chartTab === 'concentration' ? 'active' : ''} onClick={() => setChartTab('concentration')}>Konsantrasyon</button>
            <button className={chartTab === 'temperature' ? 'active' : ''} onClick={() => setChartTab('temperature')}>Sıcaklık</button>
          </div>

          <div style={{ height: 300 }}>
            {chartTab === 'conversion' && (
              <ChartClient
                type="line"
                data={{ labels: result.zProfile, datasets: [{ label: 'Dönüşüm (X)', data: result.convProfile, borderColor: 'rgb(75,192,192)', tension: 0.1, fill: false }] }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            )}

            {chartTab === 'concentration' && (
              <ChartClient
                type="line"
                data={{
                  labels: result.zProfile,
                  datasets: [
                    { label: 'A Konsantrasyonu', data: result.zProfile.map((_, i) => (result.initialConc * (1 - (result.convProfile[i] || 0)))), borderColor: 'rgb(255,99,132)', tension: 0.1, fill: false },
                    { label: 'B Konsantrasyonu', data: result.zProfile.map((_, i) => (result.initialConc * ((result.convProfile[i] || 0)))), borderColor: 'rgb(54,162,235)', tension: 0.1, fill: false }
                  ]
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            )}

            {chartTab === 'temperature' && (
              <ChartClient
                type="line"
                data={{ labels: result.zProfile, datasets: [{ label: 'Sıcaklık [K]', data: result.tempProfile.map(p => p.temperature), borderColor: 'rgb(255,159,64)', tension: 0.1, fill: false }] }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => handleDownloadAdvanced(result)}>CSV İndir</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EconomicAnalysisStub() {
  const [inputs, setInputs] = useState({
    capitalCost: 500000,
    operatingCost: 50000,
    rawMaterialCost: 200,
    productValue: 500,
    projectLife: 10,
    discountRate: 10,
    flowRate: 10,
    targetConversion: 0.8,
    molarMassProduct: 180, // g/mol (e.g. glucose) default
  });
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: isNaN(value) ? value : Number(value) }));
  }

  function calculateEconomics() {
    const capitalCost = Number(inputs.capitalCost);
    const operatingCost = Number(inputs.operatingCost);
    const rawMaterialCost = Number(inputs.rawMaterialCost);
    const productValue = Number(inputs.productValue);
    const projectLife = Number(inputs.projectLife);
    const discountRate = Number(inputs.discountRate) / 100;
    const molarMass = Number(inputs.molarMassProduct) / 1000; // kg/mol

    const targetConversion = Number(inputs.targetConversion);
    const flowRate = Number(inputs.flowRate);

    // Convert molar flow (mol/s) -> mass flow (kg/s) of product assuming stoichiometry + conversion
    // mass_flow_product (kg/s) = molar_flow * X * molarMass
    const molar_flow = Number(flowRate); // mol/s
    const X = Number(targetConversion) || 0;
    const massFlowKgPerS = molar_flow * X * molarMass; // kg/s
    const annualSeconds = 3600 * 24 * 330; // assume 330 operating days/year
    const annualProductionKg = massFlowKgPerS * annualSeconds;
    const annualProductionTon = annualProductionKg / 1000;

    const annualRevenue = annualProductionTon * productValue; // USD/yr
    // Raw material required: assume stoichiometric 1:1 molar basis per product mol -> raw material mass ~= product mass / X
    const annualRawMaterialCost = (annualProductionTon / (X || 1)) * rawMaterialCost;

    const annualCashFlow = annualRevenue - annualRawMaterialCost - operatingCost;

    // NPV calculation
    let npv = -capitalCost;
    for (let year = 1; year <= projectLife; year++) {
      npv += annualCashFlow / Math.pow(1 + discountRate, year);
    }

    // IRR via simple bisection on NPV(rate) = 0
    function npvForRate(rate) {
      let v = -capitalCost;
      for (let y = 1; y <= projectLife; y++) v += annualCashFlow / Math.pow(1 + rate, y);
      return v;
    }

    let irr = null;
    try {
      let lo = 0; let hi = 1;
      // expand hi until sign change or limit
      for (let i = 0; i < 50 && npvForRate(hi) > 0; i++) hi *= 2;
      // bisection
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        const val = npvForRate(mid);
        if (Math.abs(val) < 1e-6) { irr = mid; break; }
        if (val > 0) lo = mid; else hi = mid;
      }
      if (irr === null) irr = (lo + hi) / 2;
    } catch (e) {
      irr = null;
    }

    const payback = annualCashFlow > 0 ? capitalCost / annualCashFlow : null;
    const roi = (annualCashFlow / capitalCost) * 100;

    setResult({ npv, irr, payback, roi, annualProductionTon, annualRevenue, annualRawMaterialCost, annualCashFlow });
  }

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h3>Ekonomik Analiz Parametreleri</h3>
      <label>Yatırım Maliyeti [USD]:
        <input name="capitalCost" value={inputs.capitalCost} onChange={handleChange} />
      </label>
      <label>İşletme Maliyeti [USD/yıl]:
        <input name="operatingCost" value={inputs.operatingCost} onChange={handleChange} />
      </label>
      <label>Hammadde Maliyeti [USD/ton]:
        <input name="rawMaterialCost" value={inputs.rawMaterialCost} onChange={handleChange} />
      </label>
      <label>Ürün Değeri [USD/ton]:
        <input name="productValue" value={inputs.productValue} onChange={handleChange} />
      </label>
      <label>Ürünün Mol Kütlesi [g/mol]:
        <input name="molarMassProduct" value={inputs.molarMassProduct} onChange={handleChange} />
      </label>
      <label>Proje Ömrü [yıl]:
        <input name="projectLife" value={inputs.projectLife} onChange={handleChange} />
      </label>
      <label>İskonto Oranı [%]:
        <input name="discountRate" value={inputs.discountRate} onChange={handleChange} />
      </label>
      <label>Mol Akış Hızı, Fₐ₀ [mol/s]:
        <input name="flowRate" value={inputs.flowRate} onChange={handleChange} />
      </label>
      <label>Hedef Dönüşüm, X (0 &lt; X &lt; 1):
        <input name="targetConversion" value={inputs.targetConversion} onChange={handleChange} />
      </label>
      <div style={{ marginTop: 12 }}>
        <button onClick={calculateEconomics}>Ekonomik Analiz Yap</button>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h4>Ekonomik Analiz Sonuçları</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #dee2e6', padding: 8 }}>Gösterge</th>
                <th style={{ border: '1px solid #dee2e6', padding: 8 }}>Değer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Net Bugünkü Değer (NPV)</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{Number(result.npv).toFixed(0)} USD</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>İç Karlılık Oranı (IRR)</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.irr ? (result.irr * 100).toFixed(1) + '%' : '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Geri Ödeme Süresi</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.payback ? result.payback.toFixed(1) + ' yıl' : '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>ROI</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{Number(result.roi).toFixed(1)}%</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Yıllık Üretim</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.annualProductionTon ? result.annualProductionTon.toFixed(2) + ' ton/yr' : '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Yıllık Nakit Akışı</td>
                <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.annualCashFlow ? result.annualCashFlow.toFixed(0) + ' USD/yr' : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
