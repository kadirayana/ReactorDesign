import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, Tabs, Checkbox, fmt,
} from '../components/ui';
import { calculateReactorss } from '../src/lib/reactorss';
import { downloadCSV } from '../src/lib/utils';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const defaultInputs = {
  prodName: 'Allil klorür',
  prodMolarMass: 76.5,
  prodStoich: 1,
  coprodStoich: 1, // HCl: C3H6 + Cl2 -> C3H5Cl + HCl
  reactAName: 'Propilen',
  reactAStoich: 1,
  reactBName: 'Klor',
  reactBStoich: 1,
  conversion: 0.3,
  annualProd: 90000,
  opHours: 7200,
  reactionTemp: 783,
  P_total: 3,
  k0: 0.0322,
  E: 63.2,
  orderLim: 1,
  orderExc: 1,
  feedRatio: 5,
  limiting: 'A',
};

export default function ReactorssPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [chartTab, setChartTab] = useState('rate');
  const [sliderIdx, setSliderIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalize, setNormalize] = useState(false);
  const [absoluteFlows, setAbsoluteFlows] = useState(false);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  }

  function calculate(e) {
    e?.preventDefault();
    setError('');
    setIsPlaying(false);
    try {
      const r = calculateReactorss(inputs);
      setResults({ ...r, limitingName: inputs.limiting === 'A' ? inputs.reactAName : inputs.reactBName, excessName: inputs.limiting === 'A' ? inputs.reactBName : inputs.reactAName });
      setSliderIdx(r.Xpoints.length - 1);
      saveHistory('Özelleştirilebilir reaktör', { Ürün: inputs.prodName, X: inputs.conversion, T: `${inputs.reactionTemp} K`, P: `${inputs.P_total} atm` }, `W = ${fmt(r.W, 1)} kg`);
    } catch (err) {
      setResults(null);
      setError(err.message);
    }
  }

  // Animate the conversion marker through the reactor
  useEffect(() => {
    if (!isPlaying || !results) return undefined;
    const last = results.Xpoints.length - 1;
    const id = setInterval(() => {
      setSliderIdx(i => {
        if (i >= last) { setIsPlaying(false); return last; }
        return Math.min(last, i + Math.max(1, Math.round(last / 120)));
      });
    }, 30);
    return () => clearInterval(id);
  }, [isPlaying, results]);

  const chart = useMemo(() => {
    if (!results) return null;
    const labels = results.Xpoints.map(x => Number(x.toFixed(4)));
    // marker moves often (slider/animation): skip Chart.js animation on redraw
    const marker = { animation: false, plugins: { verticalLine: { index: sliderIdx } } };
    if (chartTab === 'rate') {
      const max = Math.max(...results.rpoints);
      return {
        data: { labels, datasets: [{ label: "−r′ (X)", data: normalize ? results.rpoints.map(v => v / max) : results.rpoints }] },
        y: normalize ? 'r / r_maks [–]' : "−r′ [kmol/(kg·h)]",
        options: marker,
      };
    }
    return {
      data: {
        labels,
        datasets: absoluteFlows
          ? [
            { label: `${results.limitingName} (sınırlayıcı)`, data: results.concLim_kmolh },
            { label: `${results.excessName} (fazla)`, data: results.concExc_kmolh },
          ]
          : [
            { label: `${results.limitingName} (sınırlayıcı)`, data: results.concLim },
            { label: `${results.excessName} (fazla)`, data: results.concExc },
          ],
      },
      y: absoluteFlows ? 'Molar akış [kmol/h]' : 'Mol kesri [–]',
      options: marker,
    };
  }, [results, chartTab, normalize, absoluteFlows, sliderIdx]);

  const selX = results?.Xpoints[sliderIdx];
  const markerPos = results ? 40 + (selX / results.Xpoints[results.Xpoints.length - 1]) * 240 : 40;

  return (
    <>
      <Head><title>Özelleştirilebilir Reaktör · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Reaksiyon Mühendisliği"
          title="Özelleştirilebilir Reaktör"
          lead="Gaz fazı katalitik dolgulu yatak: a A + b B → c P + d D. Kısmi basınçlara dayalı güç yasası kinetiği ile gereken katalizör miktarı (W = F₀ ∫ dX / −r′)."
        />

        <form onSubmit={calculate} noValidate>
          <div className="split split-even">
            <Section title="Stokiyometri" icon="🧪">
              <FormGrid>
                <Field type="text" label="Ürün adı" name="prodName" value={inputs.prodName} onChange={handleChange} />
                <Field label="Ürün mol kütlesi" unit="kg/kmol" name="prodMolarMass" value={inputs.prodMolarMass} onChange={handleChange} />
                <Field label="Ürün katsayısı c" name="prodStoich" value={inputs.prodStoich} onChange={handleChange} />
                <Field label="Yan ürün katsayısı d" name="coprodStoich" value={inputs.coprodStoich} onChange={handleChange} hint="Ör. HCl; yoksa 0" />
                <Field type="text" label="Reaktan A" name="reactAName" value={inputs.reactAName} onChange={handleChange} />
                <Field label="A katsayısı a" name="reactAStoich" value={inputs.reactAStoich} onChange={handleChange} />
                <Field type="text" label="Reaktan B" name="reactBName" value={inputs.reactBName} onChange={handleChange} />
                <Field label="B katsayısı b" name="reactBStoich" value={inputs.reactBStoich} onChange={handleChange} />
                <SelectField label="Sınırlayıcı reaktan" name="limiting" value={inputs.limiting} onChange={handleChange}
                  options={[{ value: 'A', label: inputs.reactAName || 'A' }, { value: 'B', label: inputs.reactBName || 'B' }]} />
                <Field label="Besleme oranı r" unit="fazla/sınırlayıcı" name="feedRatio" value={inputs.feedRatio} onChange={handleChange} />
              </FormGrid>
            </Section>

            <div>
              <Section title="Proses koşulları" icon="🏭">
                <FormGrid>
                  <Field label="Dönüşüm X" unit="0–1" name="conversion" value={inputs.conversion} step="0.01" onChange={handleChange} />
                  <Field label="Yıllık üretim" unit="ton/yıl" name="annualProd" value={inputs.annualProd} onChange={handleChange} />
                  <Field label="Çalışma süresi" unit="h/yıl" name="opHours" value={inputs.opHours} onChange={handleChange} />
                  <Field label="Sıcaklık T" unit="K" name="reactionTemp" value={inputs.reactionTemp} onChange={handleChange} />
                  <Field label="Toplam basınç P" unit="atm" name="P_total" value={inputs.P_total} onChange={handleChange} />
                </FormGrid>
              </Section>
              <Section title="Kinetik" icon="⚡" description="−r′ = k₀·e^(−E/RT) · P_sın^nₗ · P_fazla^nₑ">
                <FormGrid>
                  <Field label="Ön faktör k₀" unit="kmol/(kg·s·atmⁿ)" name="k0" value={inputs.k0} onChange={handleChange} />
                  <Field label="Aktivasyon enerjisi E" unit="kJ/mol" name="E" value={inputs.E} onChange={handleChange} />
                  <Field label="Sınırlayıcı için derece nₗ" name="orderLim" value={inputs.orderLim} onChange={handleChange} />
                  <Field label="Fazla reaktan için derece nₑ" name="orderExc" value={inputs.orderExc} onChange={handleChange} />
                </FormGrid>
                <ButtonRow>
                  <button type="submit">Hesapla</button>
                  <button type="button" className="btn-secondary" onClick={() => { setInputs(defaultInputs); setResults(null); setError(''); }}>Örnek değerlere dön</button>
                </ButtonRow>
              </Section>
            </div>
          </div>
        </form>

        {error && <Alert type="error">{error}</Alert>}

        {!results ? (
          <EmptyState title="Hesapla’ya basın">Varsayılan değerler propilenin klorlanmasıyla allil klorür üretimi örneğidir.</EmptyState>
        ) : (
          <>
            <Section
              title="Sonuçlar"
              icon="📊"
              description={`${results.prodName} üretimi`}
              actions={(
                <button type="button" className="btn-secondary btn-sm"
                  onClick={() => downloadCSV('reaktor_profil.csv', ['X', 'r [kmol/(kg h)]', 'y_sinirlayici', 'y_fazla', 'F_sinirlayici [kmol/h]', 'F_fazla [kmol/h]'],
                    results.Xpoints.map((x, i) => [x, results.rpoints[i], results.concLim[i], results.concExc[i], results.concLim_kmolh[i], results.concExc_kmolh[i]]))}
                >CSV indir</button>
              )}
            >
              <StatGrid>
                <Stat primary label="Katalizör miktarı W" value={results.W} unit="kg" digits={1} />
                <Stat label="Ürün akışı" value={results.prodKmolH} unit="kmol/h" />
                <Stat label={`${results.limitingName} beslemesi`} value={results.F0_lim} unit="kmol/h" />
                <Stat label={`${results.excessName} beslemesi`} value={results.F0_exc} unit="kmol/h" />
                <Stat label="k (T’de)" value={results._diag.k_val} unit="kmol/(kg·s·atmⁿ)" />
                <Stat label="Mol değişimi δ" value={results._diag.delta} digits={3} />
              </StatGrid>
              {results._diag.warning && <Alert type="warning">{results._diag.warning}</Alert>}
            </Section>

            <Section title="Reaktör boyunca profiller" icon="📈">
              <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <Tabs value={chartTab} onChange={setChartTab} tabs={[{ value: 'rate', label: 'Reaksiyon hızı' }, { value: 'conc', label: 'Bileşim' }]} />
                {chartTab === 'rate'
                  ? <Checkbox label="Normalize et" checked={normalize} onChange={e => setNormalize(e.target.checked)} />
                  : <Checkbox label="Molar akış (kmol/h) göster" checked={absoluteFlows} onChange={e => setAbsoluteFlows(e.target.checked)} />}
              </div>
              <ChartClient data={chart.data} options={chart.options} xLabel="Dönüşüm X" yLabel={chart.y} />

              <div style={{ marginTop: 20 }}>
                <div className="flex-row" style={{ marginBottom: 8 }}>
                  <button type="button" className="btn-secondary btn-sm" onClick={() => {
                    if (!isPlaying && sliderIdx >= results.Xpoints.length - 1) setSliderIdx(0);
                    setIsPlaying(p => !p);
                  }}>
                    {isPlaying ? '⏸ Durdur' : '▶ Oynat'}
                  </button>
                  <span className="small muted">Reaktör boyunca ilerleyin</span>
                </div>
                <input type="range" aria-label="Dönüşüm seçici" min={0} max={results.Xpoints.length - 1} value={sliderIdx} onChange={e => { setIsPlaying(false); setSliderIdx(Number(e.target.value)); }} />
                <StatGrid>
                  <Stat label="Seçilen X" value={selX} digits={4} />
                  <Stat label="−r′ (X)" value={results.rpoints[sliderIdx]} unit="kmol/(kg·h)" />
                  <Stat label={`y (${results.limitingName})`} value={results.concLim[sliderIdx]} digits={4} />
                  <Stat label={`y (${results.excessName})`} value={results.concExc[sliderIdx]} digits={4} />
                </StatGrid>
                <div className="reactor-diagram">
                  <svg width="100%" style={{ maxWidth: 520 }} viewBox="0 0 320 120" role="img" aria-label="Reaktör boyunca dönüşüm göstergesi">
                    <rect x="40" y="40" width="240" height="50" fill="none" stroke="currentColor" strokeWidth="2" rx="6" />
                    <polygon points="20,65 40,57 40,73" fill="currentColor" />
                    <polygon points="300,65 280,57 280,73" fill="currentColor" />
                    <text x="12" y="69" textAnchor="end">Giriş</text>
                    <text x="306" y="69" textAnchor="start">Çıkış</text>
                    <rect x="40" y="40" width={Math.max(0, markerPos - 40)} height="50" rx="6" fill="currentColor" opacity="0.12" />
                    <circle cx={markerPos} cy="65" r="7" fill="var(--chart-4)" />
                    <text x={markerPos} y="30" textAnchor="middle">X = {fmt(selX, 3)}</text>
                  </svg>
                </div>
              </div>
            </Section>

            <Section title="Çözüm adımları" icon="📝">
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Yıllık üretim saatlik molar akışa çevrilir: <strong>{fmt(results.prodKmolH)} kmol/h</strong></li>
                <li>Sınırlayıcı reaktan beslemesi F₀ = üretim · (a/c) / X = <strong>{fmt(results.F0_lim)} kmol/h</strong></li>
                <li>Fazla reaktan beslemesi r · F₀ = <strong>{fmt(results.F0_exc)} kmol/h</strong></li>
                <li>k = k₀·exp(−E/RT) = <strong>{fmt(results._diag.k_val, 4)}</strong>; her X için kısmi basınçlar toplam mol değişimi (δ = {fmt(results._diag.delta, 3)}) ile hesaplanır.</li>
                <li>W = F₀ ∫₀^X dX / (−r′) yamuk kuralıyla integre edilir: <strong>W = {fmt(results.W, 1)} kg</strong> ({fmt(results.W / 1000, 2)} ton)</li>
              </ol>
            </Section>
          </>
        )}
      </div>
    </>
  );
}
