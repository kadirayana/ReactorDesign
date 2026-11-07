import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, DataTable, fmt,
} from '../components/ui';
import { designColumn, equilibriumY } from '../src/lib/distillation';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const PRESETS = [
  { value: 'benzene-toluene', label: 'Benzen – toluen (α ≈ 2,5)', alpha: 2.5 },
  { value: 'methanol-water', label: 'Metanol – su (α ≈ 3,5, yaklaşık)', alpha: 3.5 },
  { value: 'hexane-heptane', label: 'n-Hekzan – n-heptan (α ≈ 2,6)', alpha: 2.6 },
  { value: 'propylene-propane', label: 'Propilen – propan (α ≈ 1,15, zor ayırım)', alpha: 1.15 },
  { value: 'custom', label: 'Özel α' },
];

const FEED_STATES = [
  { value: 1, label: 'Doymuş sıvı (q = 1)' },
  { value: 0, label: 'Doymuş buhar (q = 0)' },
  { value: 0.5, label: 'Yarı buharlaşmış (q = 0,5)' },
  { value: 1.2, label: 'Aşırı soğutulmuş sıvı (q = 1,2)' },
  { value: 'custom', label: 'Özel q' },
];

export default function DistillationPage() {
  const [inp, setInp] = useState({
    preset: 'benzene-toluene', alpha: 2.5, zF: 0.5, xD: 0.95, xB: 0.05,
    feedState: 1, q: 1, Rfactor: 1.5, F: 100, lambda: 31,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const onChange = e => {
    const { name, value, type } = e.target;
    setInp(prev => {
      const next = { ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value };
      if (name === 'preset' && value !== 'custom') next.alpha = PRESETS.find(p => p.value === value).alpha;
      if (name === 'feedState' && value !== 'custom') { next.feedState = Number(value); next.q = Number(value); }
      return next;
    });
  };

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      const res = designColumn({ ...inp });
      setResult({ ...res, inputs: { ...inp } });
      saveHistory('Distilasyon', { α: inp.alpha, 'z_F': inp.zF, 'x_D': inp.xD, 'x_B': inp.xB, 'R/Rmin': inp.Rfactor }, `N = ${fmt(res.mccabe.fractionalStages, 2)} kademe, R = ${fmt(res.R, 3)}`);
    } catch (err) {
      setResult(null);
      setError(err.message);
    }
  }

  const chart = useMemo(() => {
    if (!result) return null;
    const { alpha, zF, xD, xB } = result.inputs;
    const eq = Array.from({ length: 101 }, (_, i) => ({ x: i / 100, y: equilibriumY(i / 100, alpha) }));
    const I = result.mccabe.intersection;
    const line = { showLine: true, pointRadius: 0, tension: 0 };
    return {
      datasets: [
        { label: 'Denge eğrisi', data: eq, ...line, borderWidth: 2.5 },
        { label: 'Basamaklar', data: result.mccabe.steps, ...line, borderWidth: 1.5 },
        { label: 'Zenginleştirme hattı', data: [{ x: xD, y: xD }, I], ...line },
        { label: 'Sıyırma hattı', data: [{ x: xB, y: xB }, I], ...line },
        { label: 'q-doğrusu', data: [{ x: zF, y: zF }, I], ...line, borderDash: [5, 4] },
        { label: 'y = x', data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], ...line, borderWidth: 1, borderDash: [2, 3] },
      ],
    };
  }, [result]);

  const chartOptions = useMemo(() => ({
    animation: false,
    interaction: { mode: 'nearest', intersect: false },
    scales: { x: { type: 'linear', min: 0, max: 1 }, y: { type: 'linear', min: 0, max: 1 } },
    plugins: { tooltip: { callbacks: { label: c => `${c.dataset.label}: (${c.parsed.x.toFixed(3)}, ${c.parsed.y.toFixed(3)})` } } },
  }), []);

  return (
    <>
      <Head><title>Distilasyon · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Isı ve Kütle Transferi"
          title="Distilasyon Kolonu Tasarımı"
          lead="İkili karışım, sabit bağıl uçuculuk ve sabit molar taşma varsayımıyla McCabe–Thiele grafik yöntemi; Fenske, Underwood, Gilliland ve Kirkbride kısa yol yöntemleriyle karşılaştırma."
        />
        <div className="split">
          <form onSubmit={calculate} noValidate>
            <Section title="Sistem" icon="🧪">
              <FormGrid>
                <SelectField className="span-all" label="Karışım" name="preset" value={inp.preset} onChange={onChange} options={PRESETS} />
                <Field label="Bağıl uçuculuk α" name="alpha" value={inp.alpha} onChange={onChange} disabled={inp.preset !== 'custom'} />
                <SelectField label="Besleme durumu" name="feedState" value={inp.feedState} onChange={onChange} options={FEED_STATES} />
                {inp.feedState === 'custom' && <Field label="q" name="q" value={inp.q} onChange={onChange} hint="Beslemedeki sıvı kesri" />}
              </FormGrid>
            </Section>
            <Section title="Ayırma hedefi" icon="🎯" description="Hafif bileşenin mol kesirleri">
              <FormGrid>
                <Field label="Besleme z_F" name="zF" value={inp.zF} onChange={onChange} step="0.01" />
                <Field label="Distilat x_D" name="xD" value={inp.xD} onChange={onChange} step="0.01" />
                <Field label="Dip ürünü x_B" name="xB" value={inp.xB} onChange={onChange} step="0.01" />
                <Field label="R / Rmin" name="Rfactor" value={inp.Rfactor} onChange={onChange} step="0.05" hint="Tipik: 1,2 – 1,5" />
                <Field label="Besleme akışı F" unit="mol/s" name="F" value={inp.F} onChange={onChange} />
                <Field label="Gizli ısı λ" unit="kJ/mol" name="lambda" value={inp.lambda} onChange={onChange} />
              </FormGrid>
              <ButtonRow><button type="submit">Kolonu tasarla</button></ButtonRow>
            </Section>
          </form>

          <div>
            {error && <Alert type="error">{error}</Alert>}
            {!result ? (
              <EmptyState icon="🗼" title="McCabe–Thiele diyagramı burada görünecek">Kademe sayısı, besleme kademesi, geri akış ve kondenser/kazan yükleri.</EmptyState>
            ) : (
              <>
                <Section title="Sonuçlar" icon="📊">
                  <StatGrid>
                    <Stat primary label="Teorik kademe (McCabe–Thiele)" value={result.mccabe.fractionalStages} digits={2} />
                    <Stat primary label="Optimum besleme kademesi" value={result.mccabe.feedStage} digits={0} />
                    <Stat label="Geri akış oranı R" value={result.R} digits={3} />
                    <Stat label="Minimum geri akış Rmin" value={result.Rmin} digits={3} />
                    <Stat label="Minimum kademe Nmin (Fenske)" value={result.Nmin} digits={2} />
                    <Stat label="Hafif bileşen geri kazanımı" value={`%${fmt(result.recoveryLight * 100, 2)}`} raw />
                  </StatGrid>
                  <p className="small muted">Kademe sayısına kısmi kazan dahildir; tepsi sayısı ≈ N − 1. Gerçek tepsi sayısı için kademe verimine bölün.</p>
                </Section>

                <Section title="McCabe–Thiele diyagramı" icon="📈">
                  <ChartClient type="scatter" data={chart} options={chartOptions} xLabel="x (sıvı)" yLabel="y (buhar)" height={460} />
                </Section>

                <Section title="Kısa yol yöntemleriyle karşılaştırma" icon="🔍">
                  <DataTable
                    columns={[{ key: 'k', label: 'Büyüklük', text: true }, { key: 'g', label: 'McCabe–Thiele', digits: 3 }, { key: 's', label: 'Kısa yol (FUG)', digits: 3 }]}
                    rows={[
                      { k: 'Rmin', g: result.Rmin, s: result.underwoodRmin },
                      { k: 'Teorik kademe N', g: result.mccabe.fractionalStages, s: result.gilliland.N },
                      { k: 'Besleme kademesi (üstten)', g: result.mccabe.feedStage, s: result.kirkbrideFeedStage },
                    ]}
                  />
                  <p className="small muted">Kısa yol: Underwood (Rmin), Fenske + Gilliland/Eduljee (N), Kirkbride (besleme yeri).</p>
                </Section>

                <Section title="Madde ve enerji dengesi" icon="⚖️">
                  <StatGrid>
                    <Stat label="Distilat D" value={result.D} unit="mol/s" digits={2} />
                    <Stat label="Dip ürünü B" value={result.B} unit="mol/s" digits={2} />
                    <Stat label="Zenginleştirme buharı V" value={result.V} unit="mol/s" digits={2} />
                    <Stat label="Sıyırma buharı V̄" value={result.Vbar} unit="mol/s" digits={2} />
                    <Stat label="Kondenser yükü" value={result.condenserDuty} unit="kW" digits={0} />
                    <Stat label="Kazan yükü" value={result.reboilerDuty} unit="kW" digits={0} />
                  </StatGrid>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
