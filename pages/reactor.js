import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import ReactorDiagram from '../components/ReactorDiagram';
import {
  PageHeader, Section, FormGrid, Field, SelectField, Checkbox, ButtonRow,
  Alert, StatGrid, Stat, EmptyState, Tabs, fmt,
} from '../components/ui';
import {
  calculateBasicReactor, rateConstantUnits, catalystRateConstantUnits, effectivenessFromThiele,
} from '../src/lib/reactor';
import { downloadCSV } from '../src/lib/utils';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const REACTOR_OPTIONS = [
  { value: 'pfr', label: 'Piston akışlı reaktör (PFR)' },
  { value: 'cstr', label: 'Sürekli karıştırmalı tank (CSTR)' },
  { value: 'pbr', label: 'Dolgulu yatak reaktörü (PBR)' },
  { value: 'batch', label: 'Kesikli (batch) reaktör' },
];

const ORDER_OPTIONS = [
  { value: 0, label: 'Sıfırıncı derece' },
  { value: 1, label: 'Birinci derece' },
  { value: 2, label: 'İkinci derece' },
];

const REACTOR_LABEL = { pfr: 'PFR', cstr: 'CSTR', pbr: 'PBR', batch: 'Kesikli' };

function useForm(initial) {
  const [values, setValues] = useState(initial);
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    let v = value;
    if (type === 'checkbox') v = checked;
    else if (type === 'number' || (e.target.tagName === 'SELECT' && value !== '' && !isNaN(value))) v = value === '' ? '' : Number(value);
    setValues(prev => ({ ...prev, [name]: v }));
  };
  return [values, onChange, setValues];
}

export default function ReactorPage() {
  const [tab, setTab] = useState('design');
  return (
    <>
      <Head>
        <title>Reaktör Tasarımı · Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="description" content="PFR, CSTR, PBR ve kesikli reaktör tasarımı, dönüşüm profilleri ve ekonomik analiz." />
      </Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Reaksiyon Mühendisliği"
          title="Reaktör Tasarımı"
          lead="A → ürünler tipinde tek, tersinmez, güç yasası kinetiğine (−rA = k·CAⁿ) sahip, sabit yoğunluklu reaksiyon için ideal reaktör boyutlandırma."
        />
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'design', label: 'Tasarım' },
            { value: 'economic', label: 'Ekonomik Analiz' },
          ]}
        />
        {tab === 'design' ? <ReactorDesign /> : <EconomicAnalysis />}
      </div>
    </>
  );
}

function ReactorDesign() {
  const [inputs, onChange] = useForm({
    reactorType: 'pfr',
    reactionOrder: 1,
    flowRate: 10,
    initialConc: 100,
    rateConstant: 0.05,
    targetConversion: 0.8,
    selectivity: 1,
    catDensity: 1000,
    effectiveRateConstant: 1e-4,
    effectivenessFactor: 0.8,
    internalDiffusion: false,
    thieleMod: 1,
    operatingMode: 'isothermal',
    reactionTemp: 350,
    heatOfReaction: -50,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [chartTab, setChartTab] = useState('conversion');

  const order = Number(inputs.reactionOrder);
  const isPbr = inputs.reactorType === 'pbr';

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      let eta = Number(inputs.effectivenessFactor);
      if (isPbr && inputs.internalDiffusion) eta = effectivenessFromThiele(inputs.thieleMod);
      const base = calculateBasicReactor({ ...inputs, effectivenessFactor: eta });

      // Energy balance along conversion (liquid-like: cp = 4.2 kJ/(kg·K), ρ = 1000 kg/m³)
      const T0 = Number(inputs.reactionTemp);
      const dTadPerX = (-Number(inputs.heatOfReaction) * Number(inputs.initialConc)) / (4.2 * 1000);
      const coolingShare = 0.7; // simplified: cooling removes 70 % of the heat released
      const temperature = base.conversionProfile.map(p => {
        if (inputs.operatingMode === 'adiabatic') return T0 + dTadPerX * p.y;
        if (inputs.operatingMode === 'cooled') return T0 + dTadPerX * p.y * (1 - coolingShare);
        return T0;
      });

      const res = { ...base, eta: isPbr ? eta : null, temperature, dTad: dTadPerX * Number(inputs.targetConversion), inputs: { ...inputs } };
      setResult(res);
      saveHistory(
        `Reaktör (${REACTOR_LABEL[inputs.reactorType]})`,
        { 'Fₐ₀': `${inputs.flowRate} mol/s`, 'Cₐ₀': `${inputs.initialConc} mol/m³`, k: inputs.rateConstant, n: order, X: inputs.targetConversion },
        res.batchTime != null ? `t = ${fmt(res.batchTime)} s` : `V = ${fmt(res.reactorVolume)} m³`,
      );
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  const chart = useMemo(() => {
    if (!result) return null;
    const labels = result.conversionProfile.map(p => Number(p.x.toPrecision(4)));
    if (chartTab === 'conversion') {
      return { data: { labels, datasets: [{ label: 'Dönüşüm X', data: result.conversionProfile.map(p => p.y) }] }, y: 'Dönüşüm X [–]' };
    }
    if (chartTab === 'concentration') {
      const C0 = Number(result.inputs.initialConc);
      return {
        data: {
          labels,
          datasets: [
            { label: 'Cₐ', data: result.concentrationProfile.map(p => p.y) },
            { label: 'Ürün (Cₐ₀·X)', data: result.conversionProfile.map(p => C0 * p.y) },
          ],
        },
        y: 'Konsantrasyon [mol/m³]',
      };
    }
    return { data: { labels, datasets: [{ label: 'Sıcaklık', data: result.temperature }] }, y: 'Sıcaklık [K]' };
  }, [result, chartTab]);

  function exportCSV() {
    if (!result) return;
    downloadCSV(
      'reaktor_profili.csv',
      [result.profileAxis, 'X', 'CA [mol/m3]', 'T [K]'],
      result.conversionProfile.map((p, i) => [p.x, p.y, result.concentrationProfile[i].y, result.temperature[i]]),
    );
  }

  return (
    <div className="split">
      <form onSubmit={calculate} noValidate>
        <Section title="Reaktör ve kinetik" icon="⚗️">
          <FormGrid>
            <SelectField className="span-all" label="Reaktör tipi" name="reactorType" value={inputs.reactorType} onChange={onChange} options={REACTOR_OPTIONS} />
            <SelectField label="Reaksiyon derecesi" name="reactionOrder" value={inputs.reactionOrder} onChange={onChange} options={ORDER_OPTIONS} />
            {!isPbr && (
              <Field label="Hız sabiti k" unit={rateConstantUnits(order)} name="rateConstant" value={inputs.rateConstant} onChange={onChange} />
            )}
            <Field label="Molar besleme Fₐ₀" unit="mol/s" name="flowRate" value={inputs.flowRate} onChange={onChange}
              hint={inputs.reactorType === 'batch' ? 'Kesikli reaktörde süre hesabını etkilemez' : undefined} />
            <Field label="Besleme derişimi Cₐ₀" unit="mol/m³" name="initialConc" value={inputs.initialConc} onChange={onChange} />
            <Field label="Hedef dönüşüm X" unit="0–1" name="targetConversion" value={inputs.targetConversion} onChange={onChange} min="0" max="1" step="0.01" />
            <Field label="Seçicilik S" unit="0–1" name="selectivity" value={inputs.selectivity} onChange={onChange} min="0" max="1" step="0.01" hint="Tek reaksiyon için 1" />
          </FormGrid>
        </Section>

        {isPbr && (
          <Section title="Katalizör" icon="🧱" description="Hacim başına hız sabiti: k = k′ · η · ρb">
            <FormGrid>
              <Field label="Katalizöre özgü hız sabiti k′" unit={catalystRateConstantUnits(order)} name="effectiveRateConstant" value={inputs.effectiveRateConstant} onChange={onChange} />
              <Field label="Yatak yoğunluğu ρb" unit="kg/m³" name="catDensity" value={inputs.catDensity} onChange={onChange} />
              <Checkbox className="span-all" label="Etkinlik faktörünü Thiele modülünden hesapla (küresel tanecik)" name="internalDiffusion" checked={inputs.internalDiffusion} onChange={onChange} />
              {inputs.internalDiffusion ? (
                <Field label="Thiele modülü φ" unit="–" name="thieleMod" value={inputs.thieleMod} onChange={onChange}
                  hint={`η = ${fmt(effectivenessSafe(inputs.thieleMod), 4)}`} />
              ) : (
                <Field label="Etkinlik faktörü η" unit="0–1" name="effectivenessFactor" value={inputs.effectivenessFactor} onChange={onChange} step="0.01" />
              )}
            </FormGrid>
          </Section>
        )}

        <Section title="Enerji dengesi" icon="🌡️" description="Sıcaklık profili için; boyutlandırma k'nın sabit olduğunu varsayar.">
          <FormGrid>
            <SelectField className="span-all" label="Çalışma modu" name="operatingMode" value={inputs.operatingMode} onChange={onChange}
              options={[
                { value: 'isothermal', label: 'İzotermal' },
                { value: 'adiabatic', label: 'Adyabatik' },
                { value: 'cooled', label: 'Soğutmalı (ısının %70’i uzaklaştırılır)' },
              ]} />
            <Field label="Giriş sıcaklığı T₀" unit="K" name="reactionTemp" value={inputs.reactionTemp} onChange={onChange} />
            <Field label="Reaksiyon ısısı ΔHr" unit="kJ/mol" name="heatOfReaction" value={inputs.heatOfReaction} onChange={onChange} />
          </FormGrid>
          <ButtonRow>
            <button type="submit">Hesapla</button>
          </ButtonRow>
        </Section>
      </form>

      <div>
        {error && <Alert type="error">{error}</Alert>}
        {!result ? (
          <Section>
            <ReactorDiagram reactorType={inputs.reactorType} />
            <EmptyState title="Parametreleri girip Hesapla'ya basın">
              Sonuçlar, profil grafikleri ve CSV dışa aktarma burada görünecek.
            </EmptyState>
          </Section>
        ) : (
          <>
            <Section
              title="Sonuçlar"
              icon="📊"
              description={`${REACTOR_LABEL[result.inputs.reactorType]} · n = ${result.order} · X = ${result.inputs.targetConversion}`}
              actions={<button type="button" className="btn-secondary btn-sm" onClick={exportCSV}>CSV indir</button>}
            >
              <StatGrid>
                {result.batchTime != null ? (
                  <Stat primary label="Reaksiyon süresi" value={result.batchTime} unit="s" />
                ) : (
                  <>
                    <Stat primary label="Reaktör hacmi" value={result.reactorVolume} unit="m³" digits={4} />
                    <Stat label="Uzay zamanı τ" value={result.spaceTime} unit="s" />
                    <Stat label="Uzay hızı" value={result.spaceVelocity} unit="1/s" digits={5} />
                    <Stat label="Hacimsel debi v₀" value={result.v0} unit="m³/s" digits={4} />
                  </>
                )}
                {result.catalystWeight != null && <Stat label="Katalizör kütlesi" value={result.catalystWeight} unit="kg" digits={2} />}
                {result.eta != null && <Stat label="Etkinlik faktörü η" value={result.eta} digits={4} />}
                <Stat label="Verim X·S" value={result.yield} digits={4} />
                {result.inputs.operatingMode !== 'isothermal' && (
                  <Stat label="Çıkış sıcaklığı" value={result.temperature[result.temperature.length - 1]} unit="K" digits={1} />
                )}
              </StatGrid>
              {result.inputs.operatingMode === 'adiabatic' && Math.abs(result.dTad) > 50 && (
                <Alert type="warning">
                  Adyabatik sıcaklık değişimi {fmt(result.dTad, 1)} K. Bu kadar büyük bir değişimde k sabit kabul edilemez; sonuçları dikkatle yorumlayın.
                </Alert>
              )}
            </Section>

            <Section title="Profiller" icon="📈" description={`x ekseni: ${result.profileAxis}`}>
              <Tabs
                value={chartTab}
                onChange={setChartTab}
                tabs={[
                  { value: 'conversion', label: 'Dönüşüm' },
                  { value: 'concentration', label: 'Derişim' },
                  { value: 'temperature', label: 'Sıcaklık' },
                ]}
              />
              <ChartClient data={chart.data} xLabel={result.profileAxis} yLabel={chart.y} />
            </Section>

            <Section title="Reaktör şeması" icon="🧭">
              <ReactorDiagram reactorType={result.inputs.reactorType} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function effectivenessSafe(phi) {
  try { return effectivenessFromThiele(phi); } catch (e) { return NaN; }
}

function EconomicAnalysis() {
  const [inputs, onChange] = useForm({
    capitalCost: 500000,
    operatingCost: 50000,
    rawMaterialCost: 200,
    productValue: 500,
    projectLife: 10,
    discountRate: 10,
    flowRate: 10,
    targetConversion: 0.8,
    molarMassProduct: 180,
    operatingDays: 330,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function calculate(e) {
    e?.preventDefault();
    setError('');
    const capital = Number(inputs.capitalCost);
    const life = Number(inputs.projectLife);
    const rate = Number(inputs.discountRate) / 100;
    const X = Number(inputs.targetConversion);
    if (!(capital > 0) || !(life >= 1) || !(X > 0 && X <= 1)) {
      setResult(null);
      setError('Yatırım > 0, proje ömrü ≥ 1 yıl ve 0 < X ≤ 1 olmalıdır.');
      return;
    }

    // product mass flow: F_A0 [mol/s] · X · M [kg/mol]
    const massFlow = Number(inputs.flowRate) * X * (Number(inputs.molarMassProduct) / 1000);
    const annualTon = (massFlow * 3600 * 24 * Number(inputs.operatingDays)) / 1000;
    const revenue = annualTon * Number(inputs.productValue);
    // 1:1 molar stoichiometry, unconverted feed counted as consumed (no recycle)
    const rawCost = (annualTon / X) * Number(inputs.rawMaterialCost);
    const cashFlow = revenue - rawCost - Number(inputs.operatingCost);

    const npvAt = r => {
      let v = -capital;
      for (let y = 1; y <= life; y++) v += cashFlow / Math.pow(1 + r, y);
      return v;
    };

    // IRR by bisection; only defined when the cash flows change sign
    let irr = null;
    if (cashFlow > 0 && npvAt(0) > 0) {
      let lo = 0;
      let hi = 1;
      while (npvAt(hi) > 0 && hi < 1e3) hi *= 2;
      for (let i = 0; i < 100; i++) {
        const mid = (lo + hi) / 2;
        if (npvAt(mid) > 0) lo = mid; else hi = mid;
      }
      irr = (lo + hi) / 2;
    }

    const npv = npvAt(rate);
    // year-by-year cumulative discounted cash flow for the chart
    const cumulative = [];
    let acc = -capital;
    cumulative.push(acc);
    for (let y = 1; y <= life; y++) {
      acc += cashFlow / Math.pow(1 + rate, y);
      cumulative.push(acc);
    }

    setResult({
      npv, irr, annualTon, revenue, rawCost, cashFlow, cumulative,
      payback: cashFlow > 0 ? capital / cashFlow : null,
      roi: (cashFlow / capital) * 100,
    });
    saveHistory('Ekonomik analiz', { Yatırım: `${capital} USD`, Ömür: `${life} yıl`, 'İskonto': `%${inputs.discountRate}` }, `NBD = ${fmt(npv, 0)} USD`);
  }

  return (
    <div className="split">
      <form onSubmit={calculate} noValidate>
        <Section title="Maliyet ve fiyatlar" icon="💰">
          <FormGrid>
            <Field label="Yatırım maliyeti" unit="USD" name="capitalCost" value={inputs.capitalCost} onChange={onChange} />
            <Field label="İşletme maliyeti" unit="USD/yıl" name="operatingCost" value={inputs.operatingCost} onChange={onChange} />
            <Field label="Hammadde fiyatı" unit="USD/ton" name="rawMaterialCost" value={inputs.rawMaterialCost} onChange={onChange} />
            <Field label="Ürün fiyatı" unit="USD/ton" name="productValue" value={inputs.productValue} onChange={onChange} />
            <Field label="Proje ömrü" unit="yıl" name="projectLife" value={inputs.projectLife} onChange={onChange} step="1" />
            <Field label="İskonto oranı" unit="%" name="discountRate" value={inputs.discountRate} onChange={onChange} />
          </FormGrid>
        </Section>
        <Section title="Üretim" icon="🏭">
          <FormGrid>
            <Field label="Molar besleme Fₐ₀" unit="mol/s" name="flowRate" value={inputs.flowRate} onChange={onChange} />
            <Field label="Dönüşüm X" unit="0–1" name="targetConversion" value={inputs.targetConversion} onChange={onChange} step="0.01" />
            <Field label="Ürün mol kütlesi" unit="g/mol" name="molarMassProduct" value={inputs.molarMassProduct} onChange={onChange} />
            <Field label="Yıllık çalışma" unit="gün" name="operatingDays" value={inputs.operatingDays} onChange={onChange} step="1" />
          </FormGrid>
          <ButtonRow><button type="submit">Analiz et</button></ButtonRow>
        </Section>
      </form>

      <div>
        {error && <Alert type="error">{error}</Alert>}
        {!result ? (
          <EmptyState icon="💹" title="Ekonomik göstergeler burada görünecek">NBD, İKO, geri ödeme süresi ve kümülatif nakit akışı.</EmptyState>
        ) : (
          <>
            <Section title="Göstergeler" icon="📊">
              <StatGrid>
                <Stat primary label="Net bugünkü değer" value={result.npv} unit="USD" digits={0} />
                <Stat label="İç karlılık oranı" value={result.irr != null ? `%${fmt(result.irr * 100, 1)}` : '—'} raw />
                <Stat label="Basit geri ödeme" value={result.payback} unit="yıl" digits={1} />
                <Stat label="Yıllık getiri (ROI)" value={`%${fmt(result.roi, 1)}`} raw />
                <Stat label="Yıllık üretim" value={result.annualTon} unit="ton" digits={1} />
                <Stat label="Yıllık nakit akışı" value={result.cashFlow} unit="USD" digits={0} />
              </StatGrid>
              {result.cashFlow <= 0 && <Alert type="warning">Yıllık nakit akışı negatif: gelir, hammadde ve işletme giderlerini karşılamıyor.</Alert>}
              <p className="small muted">Varsayımlar: 1:1 molar stokiyometri, geri döngü yok (dönüşmeyen besleme kayıp sayılır), sabit yıllık nakit akışı.</p>
            </Section>
            <Section title="Kümülatif indirgenmiş nakit akışı" icon="📈">
              <ChartClient
                type="bar"
                data={{ labels: result.cumulative.map((_, i) => `${i}. yıl`), datasets: [{ label: 'Kümülatif NBD [USD]', data: result.cumulative }] }}
                yLabel="USD"
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
