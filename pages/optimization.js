import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, Tabs, fmt,
} from '../components/ui';
import { optimizeReactor, sensitivity, objectiveValue } from '../src/lib/optimization';
import { saveHistory } from '../src/lib/history';

const PlotlyClient = dynamic(() => import('../components/PlotlyClient'), { ssr: false });
const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const OBJECTIVES = [
  { value: 'yield', label: 'Maksimum verim (X·S)' },
  { value: 'conversion', label: 'Maksimum dönüşüm' },
  { value: 'selectivity', label: 'Maksimum seçicilik' },
  { value: 'cost', label: 'Minimum maliyet' },
];
const OBJ_LABEL = { yield: 'Verim Y', conversion: 'Dönüşüm X', selectivity: 'Seçicilik S', cost: 'Maliyet [$]' };

const defaults = {
  type: 'CSTR',
  objective: 'yield',
  Tmin: 20, Tmax: 200, Vmin: 1, Vmax: 100,
  Q: 1,
  k01: 1e6, Ea1: 50,
  k02: 1e9, Ea2: 75,
  costV: 100, costT: 10,
  minX: 0, minS: 0,
};

export default function OptimizationPage() {
  const [p, setP] = useState(defaults);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('surface');
  const [sens, setSens] = useState({ variable: 'T', steps: 41 });

  const onChange = e => {
    const { name, value, type } = e.target;
    setP(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  function run(e) {
    e?.preventDefault();
    setError('');
    try {
      const res = optimizeReactor({ ...p, gridSize: 41 });
      setResult({ ...res, params: { ...p } });
      if (res.best) {
        saveHistory('Optimizasyon', { Reaktör: p.type, Hedef: OBJ_LABEL[p.objective] }, `T = ${fmt(res.best.T, 1)} °C, V = ${fmt(res.best.V, 2)} L`);
      }
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  const sensData = useMemo(() => {
    if (!result?.best) return null;
    const rp = result.params;
    const rows = sensitivity(rp, {
      variable: sens.variable,
      min: sens.variable === 'T' ? rp.Tmin : rp.Vmin,
      max: sens.variable === 'T' ? rp.Tmax : rp.Vmax,
      steps: sens.steps,
      fixed: sens.variable === 'T' ? result.best.V : result.best.T,
    });
    return {
      labels: rows.map(r => Number((sens.variable === 'T' ? r.T : r.V).toFixed(2))),
      datasets: [
        { label: 'Dönüşüm X', data: rows.map(r => r.X) },
        { label: 'Seçicilik S', data: rows.map(r => r.S) },
        { label: 'Verim Y', data: rows.map(r => r.Y) },
      ],
    };
  }, [result, sens]);

  const plots = useMemo(() => {
    if (!result) return null;
    const rp = result.params;
    const n = Math.round(Math.sqrt(result.samples.length));
    const Ts = Array.from({ length: n }, (_, i) => result.samples[i * n].T);
    const Vs = Array.from({ length: n }, (_, j) => result.samples[j].V);
    // Plotly surface: z[row = V index][col = T index]
    const z = Vs.map((_, j) => Ts.map((__, i) => objectiveValue(result.samples[i * n + j], rp.objective)));
    return { Ts, Vs, z };
  }, [result]);

  return (
    <>
      <Head><title>Reaktör Optimizasyonu · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Reaksiyon Mühendisliği"
          title="Reaktör Optimizasyonu"
          lead="Paralel reaksiyonlar (A → B istenen, A → C yan ürün) için sıcaklık ve hacmin optimizasyonu. Yüksek sıcaklık dönüşümü artırırken, yan reaksiyonun aktivasyon enerjisi daha yüksekse seçiciliği düşürür."
        />
        <div className="split">
          <form onSubmit={run} noValidate>
            <Section title="Problem" icon="🎯">
              <FormGrid>
                <SelectField label="Reaktör" name="type" value={p.type} onChange={onChange} options={[{ value: 'CSTR', label: 'CSTR' }, { value: 'PFR', label: 'PFR' }]} />
                <SelectField label="Hedef" name="objective" value={p.objective} onChange={onChange} options={OBJECTIVES} />
                <Field label="T min" unit="°C" name="Tmin" value={p.Tmin} onChange={onChange} />
                <Field label="T maks" unit="°C" name="Tmax" value={p.Tmax} onChange={onChange} />
                <Field label="V min" unit="L" name="Vmin" value={p.Vmin} onChange={onChange} />
                <Field label="V maks" unit="L" name="Vmax" value={p.Vmax} onChange={onChange} />
                <Field label="Hacimsel debi Q" unit="L/s" name="Q" value={p.Q} onChange={onChange} />
              </FormGrid>
            </Section>
            <Section title="Kinetik" icon="⚡" description="k = k₀·exp(−Ea/RT), birinci derece">
              <FormGrid>
                <Field label="İstenen: k₀₁" unit="1/s" name="k01" value={p.k01} onChange={onChange} />
                <Field label="İstenen: Ea₁" unit="kJ/mol" name="Ea1" value={p.Ea1} onChange={onChange} />
                <Field label="Yan: k₀₂" unit="1/s" name="k02" value={p.k02} onChange={onChange} />
                <Field label="Yan: Ea₂" unit="kJ/mol" name="Ea2" value={p.Ea2} onChange={onChange} />
              </FormGrid>
            </Section>
            <Section title="Maliyet ve kısıtlar" icon="⚖️">
              <FormGrid>
                <Field label="Hacim maliyeti" unit="$/L" name="costV" value={p.costV} onChange={onChange} />
                <Field label="Isıtma maliyeti" unit="$/°C" name="costT" value={p.costT} onChange={onChange} hint="25 °C üstü için" />
                <Field label="Min. dönüşüm" unit="0–1" name="minX" value={p.minX} onChange={onChange} step="0.01" />
                <Field label="Min. seçicilik" unit="0–1" name="minS" value={p.minS} onChange={onChange} step="0.01" />
              </FormGrid>
              <ButtonRow><button type="submit">Optimize et</button></ButtonRow>
            </Section>
          </form>

          <div>
            {error && <Alert type="error">{error}</Alert>}
            {!result ? (
              <EmptyState icon="🎯" title="Optimum tasarım burada görünecek">Izgara taraması + yerel arama ile T ve V uzayı taranır.</EmptyState>
            ) : !result.best ? (
              <Alert type="warning">Kısıtları sağlayan bir tasarım yok. Minimum dönüşüm/seçiciliği düşürün veya aralıkları genişletin.</Alert>
            ) : (
              <>
                <Section title="Optimum" icon="🏆" description={OBJECTIVES.find(o => o.value === result.params.objective).label}>
                  <StatGrid>
                    <Stat primary label="Sıcaklık" value={result.best.T} unit="°C" digits={1} />
                    <Stat primary label="Hacim" value={result.best.V} unit="L" digits={2} />
                    <Stat label="Dönüşüm X" value={result.best.X} digits={4} />
                    <Stat label="Seçicilik S" value={result.best.S} digits={4} />
                    <Stat label="Verim Y" value={result.best.Y} digits={4} />
                    <Stat label="Maliyet" value={result.best.cost} unit="$" digits={0} />
                    <Stat label="Kalış süresi τ" value={result.best.tau} unit="s" digits={2} />
                  </StatGrid>
                </Section>
                <Section title="Görselleştirme" icon="📈">
                  <Tabs value={tab} onChange={setTab} tabs={[
                    { value: 'surface', label: 'Hedef yüzeyi' },
                    { value: 'pareto', label: 'Pareto (X – maliyet)' },
                    { value: 'sensitivity', label: 'Duyarlılık' },
                  ]} />
                  {tab === 'surface' && (
                    <PlotlyClient
                      height={460}
                      data={[
                        { type: 'contour', x: plots.Ts, y: plots.Vs, z: plots.z, colorscale: 'Viridis', colorbar: { title: OBJ_LABEL[result.params.objective] } },
                        { type: 'scatter', mode: 'markers', x: [result.best.T], y: [result.best.V], marker: { color: '#DC2626', size: 12, symbol: 'star' }, name: 'Optimum' },
                      ]}
                      layout={{ xaxis: { title: 'Sıcaklık [°C]' }, yaxis: { title: 'Hacim [L]' }, showlegend: false }}
                    />
                  )}
                  {tab === 'pareto' && (
                    <PlotlyClient
                      height={460}
                      data={[
                        { type: 'scatter', mode: 'markers', name: 'Tüm tasarımlar', x: result.samples.map(d => d.X), y: result.samples.map(d => d.cost), marker: { size: 5, color: result.samples.map(d => d.S), colorscale: 'Viridis', showscale: true, colorbar: { title: 'S' }, opacity: 0.6 } },
                        { type: 'scatter', mode: 'lines+markers', name: 'Pareto cephesi', x: result.front.map(d => d.X), y: result.front.map(d => d.cost), line: { color: '#DC2626', width: 2 }, marker: { size: 6, color: '#DC2626' } },
                      ]}
                      layout={{ xaxis: { title: 'Dönüşüm X' }, yaxis: { title: 'Maliyet [$]' }, legend: { orientation: 'h', y: -0.2 } }}
                    />
                  )}
                  {tab === 'sensitivity' && (
                    <>
                      <div className="form-grid" style={{ marginBottom: 12 }}>
                        <SelectField label="Değişken" value={sens.variable} onChange={e => setSens(s => ({ ...s, variable: e.target.value }))}
                          options={[{ value: 'T', label: `Sıcaklık (V = ${fmt(result.best.V, 2)} L sabit)` }, { value: 'V', label: `Hacim (T = ${fmt(result.best.T, 1)} °C sabit)` }]} />
                        <Field label="Nokta sayısı" value={sens.steps} onChange={e => setSens(s => ({ ...s, steps: Number(e.target.value) || 3 }))} step={1} min={3} />
                      </div>
                      <ChartClient data={sensData} xLabel={sens.variable === 'T' ? 'Sıcaklık [°C]' : 'Hacim [L]'} yLabel="Kesir [–]" />
                    </>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
