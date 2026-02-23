import React, { useState } from 'react';
import Head from 'next/head';
import ChartClient from '../components/ChartClient';
import TabButton from '../components/TabButton';
import ReactorDiagram from '../components/ReactorDiagram';
import { calculateBasicReactor } from '../src/lib/reactor';
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
        <div style={{ background: 'white', padding: 20, borderRadius: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 400 }}>
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
    targetConversion: 0.8
  });
  const [result, setResult] = useState(null);
  const [chartTab, setChartTab] = useState('conversion');
  // local UI toggles mirrored from inputs for easier render
  const [showCatParams, setShowCatParams] = useState(inputs.reactorType === 'pbr');
  const [showCustomKinetics, setShowCustomKinetics] = useState(inputs.reactionOrder === 'custom');
  const [coolingEnabled, setCoolingEnabled] = useState(inputs.operatingMode === 'nonisothermal');
  const [thieleEnabled, setThieleEnabled] = useState(inputs.internalDiffusion === true);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: isNaN(value) ? value : Number(value) }));
  }

  function runCalc() {
    const res = calculateBasicReactor(inputs);
    setResult(res);
  }



  function handleDownloadBasic(res) {
    if (!res) return;
    const headers = ['x', 'conversion', 'concA'];
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
      <label>Hız Sabiti, k [1/s]:
        <input name="rateConstant" value={inputs.rateConstant} onChange={handleChange} />
      </label>
      <label>Hedef Dönüşüm, X (0 &lt; X &lt; 1):
        <input name="targetConversion" value={inputs.targetConversion} onChange={handleChange} />
      </label>
      <div style={{ marginTop: 12 }}>
        <button onClick={runCalc}>Hesapla ve Görselleştir</button>
      </div>
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Sonuçlar</h3>
          <p>Reaktör hacmi: {result.reactorVolume.toFixed(3)}</p>
          <p>Boşluk zamanı: {result.spaceTime.toFixed(3)}</p>
          <p>Seçicilik: {result.selectivity}</p>
          <p>Verim: {result.yield}</p>
          <h4>Dönüşüm Profili</h4>
          <ChartClient
            type="line"
            data={{
              labels: result.conversionProfile.map(p => p.x),
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
    // Ported calculation logic from reactor.html
    const {
      reactorType, reactionOrder, flowRate, initialConc, rateConstant, targetConversion,
      effectiveRateConstant, catDensity, effectivenessFactor, reactionTemp, heatOfReaction,
      activationEnergy, operatingMode
    } = inputs;

    const reactorTypeCode = reactorType;
    const order = reactionOrder === 'custom' ? 1 : Number(reactionOrder);

    const flow = Number(flowRate);
    const ca0 = Number(initialConc);
    const k = Number(rateConstant);
    const targetX = Number(targetConversion);

    // basic input validation to avoid NaN/Div0
    if (!isFinite(ca0) || ca0 <= 0) { setCalcError('Başlangıç konsantrasyonu (>0) girin.'); return; }
    if (!isFinite(flow) || flow <= 0) { setCalcError('Mol akış hızı (>0) girin.'); return; }
    if (!isFinite(k) || k <= 0) { setCalcError('Hız sabiti (>0) girin.'); return; }
    if (!isFinite(targetX) || targetX <= 0 || targetX >= 1) { setCalcError('Hedef dönüşüm 0 < X < 1 aralığında olmalıdır.'); return; }

    let reactorVolume = 0;
    switch (reactorTypeCode) {
      case 'pfr':
        if (order === 1) reactorVolume = (flow / ca0) * Math.log(1 / (1 - targetX)) / k;
        else if (order === 2) reactorVolume = (flow / ca0) * (1 / (1 - targetX) - 1) / (k * ca0);
        else reactorVolume = (flow * targetX) / (k * ca0);
        break;
      case 'cstr':
        if (order === 1) reactorVolume = (flow * targetX) / (k * ca0 * (1 - targetX));
        else if (order === 2) reactorVolume = (flow * targetX) / (k * Math.pow(ca0 * (1 - targetX), 2));
        else reactorVolume = (flow * targetX) / k;
        break;
      case 'pbr':
        const effK = Number(effectiveRateConstant || 1);
        const cd = Number(catDensity || 1);
        const effF = Number(effectivenessFactor || 1);
        if (order === 1) reactorVolume = (flow / ca0) * Math.log(1 / (1 - targetX)) / (effK * effF * cd);
        else if (order === 2) reactorVolume = (flow / ca0) * (1 / (1 - targetX) - 1) / (effK * effF * cd * ca0);
        else reactorVolume = (flow * targetX) / (effK * effF * cd);
        break;
      case 'batch':
        if (order === 1) reactorVolume = Math.log(1 / (1 - targetX)) / k;
        else if (order === 2) reactorVolume = (1 / (1 - targetX) - 1) / (k * ca0);
        else reactorVolume = targetX / (k * ca0);
        break;
      default:
        reactorVolume = 0;
    }

    let spaceTime = 0;
    let spaceVelocity = 0;
    if (reactorTypeCode === 'batch') {
      spaceTime = reactorVolume;
      spaceVelocity = spaceTime && isFinite(spaceTime) ? 1 / spaceTime : 0;
    } else {
      spaceTime = reactorVolume * ca0 / flow || 0;
      spaceVelocity = spaceTime && isFinite(spaceTime) ? 1 / spaceTime : 0;
    }

    const selectivity = 0.95; // TODO: Add user input for selectivity
    const yld = targetX * selectivity;

    // profiles
    const dataPoints = 100;
    const zProfile = [];
    const convProfile = [];
    const tempProfile = [];
    const initialTemp = Number(reactionTemp) || 350;
    const heatOfRxn = Number(heatOfReaction) || -50; // kJ/mol

    if (reactorTypeCode === 'pfr' || reactorTypeCode === 'pbr') {
      for (let i = 0; i <= dataPoints; i++) {
        const z = i / dataPoints;
        let conversion = 0;
        if (order === 1) conversion = 1 - Math.exp(-k * z * 5);
        else if (order === 2) conversion = (k * ca0 * z * 5) / (1 + k * ca0 * z * 5);
        else conversion = Math.min(1, k * z * 5 / ca0);

        const position = z * 5;
        zProfile.push(position);
        convProfile.push(conversion);

        let temp = initialTemp;
        if (operatingMode === 'isothermal') temp = initialTemp;
        else if (operatingMode === 'adiabatic') {
          const cp = 4.2; const density = 1000;
          const maxTempRise = -heatOfRxn * ca0 * targetX / (cp * density);
          temp = initialTemp + maxTempRise * z;
        } else {
          const cp = 4.2; const density = 1000;
          const maxAdiabaticTempRise = -heatOfRxn * ca0 * targetX / (cp * density);
          const coolingEfficiency = 0.7;
          temp = initialTemp + maxAdiabaticTempRise * z * (1 - coolingEfficiency);
        }

        tempProfile.push({ position, temperature: temp });
      }
    } else if (reactorTypeCode === 'cstr') {
      const numCSTR = 10;
      for (let i = 0; i <= numCSTR; i++) {
        let conversion = 0;
        if (order === 1) {
          const tauTotal = 5; const tau = tauTotal / numCSTR;
          if (i > 0) conversion = 1 - 1 / Math.pow(1 + k * tau, i);
        } else if (order === 2) {
          const tauTotal = 5; const tau = tauTotal / numCSTR;
          if (i > 0) conversion = i * k * ca0 * tau / (1 + i * k * ca0 * tau);
        } else {
          const tauTotal = 5; const tau = tauTotal / numCSTR;
          conversion = Math.min(1, i * k * tau / ca0);
        }
        zProfile.push(i);
        convProfile.push(conversion);

        let temp = initialTemp;
        if (operatingMode === 'isothermal') temp = initialTemp;
        else if (operatingMode === 'adiabatic') {
          const maxTempRise = -heatOfRxn * ca0 * targetX / (4.2 * 1000);
          temp = initialTemp + (maxTempRise / numCSTR) * i;
        } else {
          const coolingEfficiency = 0.7;
          const maxAdiabaticTempRise = -heatOfRxn * ca0 * targetX / (4.2 * 1000);
          temp = initialTemp + (maxAdiabaticTempRise / numCSTR) * i * (1 - coolingEfficiency);
        }
        tempProfile.push({ position: i, temperature: temp });
      }
    } else if (reactorTypeCode === 'batch') {
      for (let i = 0; i <= dataPoints; i++) {
        const t = i / dataPoints * 5;
        let conversion = 0;
        if (order === 1) conversion = 1 - Math.exp(-k * t);
        else if (order === 2) conversion = (k * ca0 * t) / (1 + k * ca0 * t);
        else conversion = Math.min(1, k * t / ca0);

        zProfile.push(t);
        convProfile.push(conversion);

        let temp = initialTemp;
        if (operatingMode === 'isothermal') temp = initialTemp;
        else if (operatingMode === 'adiabatic') {
          const maxTempRise = -heatOfRxn * ca0 * targetX / (4.2 * 1000);
          temp = initialTemp + maxTempRise * (i / dataPoints);
        } else {
          const maxAdiabaticTempRise = -heatOfRxn * ca0 * targetX / (4.2 * 1000);
          const maxTemp = initialTemp + maxAdiabaticTempRise * 0.5;
          const tt = i / dataPoints;
          let tval;
          if (tt < 0.5) tval = maxTemp - (maxTemp - initialTemp) * Math.exp(-3 * tt);
          else tval = Math.max(initialTemp, maxTemp - (maxTemp - initialTemp) * (tt - 0.5) / 0.5);
          temp = tval;
        }
        tempProfile.push({ position: t, temperature: temp });
      }
    }

    const finalX = convProfile.length ? convProfile[convProfile.length - 1] : null;
    const finalT = tempProfile.length ? tempProfile[tempProfile.length - 1].temperature : null;

    setResult({
      reactorVolume,
      spaceTime,
      selectivity,
      yield: yld,
      reactionTemp: initialTemp,
      initialConc: ca0,
      flowRate: flow,
      rateConstant: k,
      activationEnergy: inputs.activationEnergy,
      heatOfReaction: inputs.heatOfReaction,
      targetConversion: targetX,
      operatingMode: inputs.operatingMode,
      finalT,
      finalX,
      length: 5,
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
            <label>Katalizöre Özgü Hız Sabiti, kₑff [1/s.kg]:
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
        <label>Hız Sabiti, k₀ [1/s]:
          <input name="rateConstant" value={inputs.rateConstant} onChange={handleChange} />
        </label>
        <label>Hedef Dönüşüm, X (0 &lt; X &lt; 1):
          <input name="targetConversion" value={inputs.targetConversion} onChange={handleChange} />
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

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Sonuçlar</h3>

          <div id="reactorPerformance">
            <h4>Performans Parametreleri</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #dee2e6', padding: 8 }}>Parametre</th>
                  <th style={{ border: '1px solid #dee2e6', padding: 8 }}>Değer</th>
                  <th style={{ border: '1px solid #dee2e6', padding: 8 }}>Birim</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Reaktör Hacmi/Uzunluğu</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.reactorVolume ? result.reactorVolume.toFixed(3) : '-'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.reactorVolume ? (inputs.reactorType === 'batch' ? 'saat' : 'm³') : '-'}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Uzay Zamanı</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.spaceTime ? result.spaceTime.toFixed(3) : '-'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>s</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Uzay Hızı</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.spaceTime ? (1 / result.spaceTime).toFixed(4) : '-'}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>1/s</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Dönüşüm</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{(result.targetConversion * 1).toString()}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>-</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Seçicilik</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.selectivity}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>-</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>Verim</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>{result.yield}</td>
                  <td style={{ border: '1px solid #dee2e6', padding: 8 }}>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="reactorDiagram" style={{ marginTop: 20, padding: 10, border: '1px solid #dee2e6', borderRadius: 4, textAlign: 'center' }}>
            <h4>Reaktör Şeması</h4>
            <ReactorDiagram reactorType={inputs.reactorType} />
          </div>

          <h4 style={{ marginTop: 20 }}>Performans Grafikleri</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setChartTab('conversion')} style={{ background: chartTab === 'conversion' ? '#007bff' : '#f1f1f1', color: chartTab === 'conversion' ? 'white' : '#495057', border: 'none', padding: '8px 12px' }}>Dönüşüm</button>
            <button onClick={() => setChartTab('concentration')} style={{ background: chartTab === 'concentration' ? '#007bff' : '#f1f1f1', color: chartTab === 'concentration' ? 'white' : '#495057', border: 'none', padding: '8px 12px' }}>Konsantrasyon</button>
            <button onClick={() => setChartTab('temperature')} style={{ background: chartTab === 'temperature' ? '#007bff' : '#f1f1f1', color: chartTab === 'temperature' ? 'white' : '#495057', border: 'none', padding: '8px 12px' }}>Sıcaklık</button>
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
