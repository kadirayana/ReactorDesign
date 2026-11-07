import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, DataTable, fmt,
} from '../components/ui';
import {
  dynamicSeries, cstrSeries, pfrSeries, equilibriumCompute, heatTransferTransient,
  heatTransferQ, michaelisSeries, multicomponentSeriesAdvanced,
} from '../src/lib/dynamics';
import { downloadCSV } from '../src/lib/utils';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const SIM_TYPES = [
  { value: 'dynamic', label: 'Kesikli birinci derece bozunma — C(t) = C₀e^(−kt)', short: 'Kesikli bozunma' },
  { value: 'cstr', label: 'CSTR devreye alma ve seri CSTR’ler', short: 'CSTR' },
  { value: 'pfr', label: 'PFR boyunca derişim', short: 'PFR' },
  { value: 'multicomponent', label: 'Seri reaksiyon A → B → C', short: 'Seri reaksiyon' },
  { value: 'michaelis', label: 'Michaelis–Menten enzim kinetiği', short: 'Michaelis–Menten' },
  { value: 'heattransfer', label: 'Toplu kütle (lumped) soğuma/ısınma', short: 'Toplu kütle ısıl' },
  { value: 'equilibrium', label: 'A ⇌ B denge bileşimi (ΔG°’den)', short: 'Denge' },
];

const defaultInputs = {
  simType: 'cstr',
  C0: 1.0,
  kDyn: 0.1,
  simTime: 200,
  tau: 40,
  v: 0.1,
  n: 3,
  Q: 0.01,
  V: 50,
  deltaG: -10,
  temp: 298,
  dT: 20,
  area: 5,
  U: 100,
  mCp: 1000,
  Vmax: 1,
  Km: 0.5,
  S0: 1.0,
  kA: 0.1,
  kB: 0.05,
};

const positive = (v, msg) => { if (!(Number(v) > 0)) throw new Error(msg); };

function simulate(i) {
  switch (i.simType) {
    case 'dynamic': {
      positive(i.C0, 'C₀ pozitif olmalıdır.'); positive(i.kDyn, 'k pozitif olmalıdır.'); positive(i.simTime, 'Süre pozitif olmalıdır.');
      const data = dynamicSeries({ C0: i.C0, k: i.kDyn, simTime: i.simTime, points: 101 });
      return { data, x: 't', series: [{ key: 'C', label: 'C(t)' }], xLabel: 'Zaman [s]', yLabel: 'Derişim', half: Math.log(2) / i.kDyn };
    }
    case 'cstr': {
      positive(i.C0, 'C₀ pozitif olmalıdır.'); positive(i.kDyn, 'k pozitif olmalıdır.'); positive(i.tau, 'τ pozitif olmalıdır.'); positive(i.simTime, 'Süre pozitif olmalıdır.');
      const data = cstrSeries({ C0: i.C0, k: i.kDyn, tau: i.tau, simTime: i.simTime, points: 201 });
      const n = Math.max(1, Math.round(Number(i.n) || 1));
      const steady = Array.from({ length: n }, (_, j) => {
        const Cn = i.C0 / Math.pow(1 + i.kDyn * i.tau, j + 1);
        return { n: j + 1, C: Cn, X: (i.C0 - Cn) / i.C0 };
      });
      const Css = i.C0 / (1 + i.kDyn * i.tau);
      return {
        data, x: 't', series: [{ key: 'C', label: 'C(t) — çıkış' }], xLabel: 'Zaman [s]', yLabel: 'Derişim',
        Css, X1: 1 - Css / i.C0, steady, V: i.v > 0 ? i.tau * i.v : null, n,
        t95: 3 / (1 / i.tau + i.kDyn), // three time constants ≈ 95 % of the way to steady state
      };
    }
    case 'pfr': {
      positive(i.C0, 'C₀ pozitif olmalıdır.'); positive(i.kDyn, 'k pozitif olmalıdır.'); positive(i.V, 'Hacim pozitif olmalıdır.'); positive(i.Q, 'Debi pozitif olmalıdır.');
      const data = pfrSeries({ C0: i.C0, k: i.kDyn, V: i.V, Q: i.Q, points: 101 });
      const Cout = data[data.length - 1].C;
      return { data, x: 'V', series: [{ key: 'C', label: 'C(V)' }], xLabel: 'Reaktör hacmi [m³]', yLabel: 'Derişim', Cout, X: 1 - Cout / i.C0, tau: i.V / i.Q };
    }
    case 'multicomponent': {
      positive(i.C0, 'A₀ pozitif olmalıdır.'); positive(i.kA, 'k₁ pozitif olmalıdır.'); positive(i.simTime, 'Süre pozitif olmalıdır.');
      if (!(i.kB >= 0)) throw new Error('k₂ negatif olamaz.');
      const raw = multicomponentSeriesAdvanced({ C0: i.C0, kA: i.kA, kB: i.kB, simTime: i.simTime, points: 201 });
      const data = raw.map(r => ({ ...r, C: Math.max(0, i.C0 - r.A - r.B) }));
      const tMax = i.kB > 0 && Math.abs(i.kA - i.kB) > 1e-12 ? Math.log(i.kA / i.kB) / (i.kA - i.kB) : (i.kB > 0 ? 1 / i.kA : null);
      const Bmax = data.reduce((m, r) => Math.max(m, r.B), 0);
      return { data, x: 't', series: [{ key: 'A', label: 'A' }, { key: 'B', label: 'B (ara ürün)' }, { key: 'C', label: 'C' }], xLabel: 'Zaman [s]', yLabel: 'Derişim', tMax, Bmax };
    }
    case 'michaelis': {
      positive(i.Vmax, 'Vmax pozitif olmalıdır.'); positive(i.Km, 'Km pozitif olmalıdır.'); positive(i.S0, 'S₀ pozitif olmalıdır.'); positive(i.simTime, 'Süre pozitif olmalıdır.');
      const data = michaelisSeries({ Vmax: i.Vmax, Km: i.Km, S0: i.S0, simTime: i.simTime, points: 201 }).map(r => ({ ...r, P: i.S0 - r.S }));
      return { data, x: 't', series: [{ key: 'S', label: 'Substrat S' }, { key: 'P', label: 'Ürün P' }], xLabel: 'Zaman [s]', yLabel: 'Derişim', v0: (i.Vmax * i.S0) / (i.Km + i.S0) };
    }
    case 'heattransfer': {
      positive(i.area, 'Alan pozitif olmalıdır.'); positive(i.U, 'U pozitif olmalıdır.'); positive(i.mCp, 'm·cₚ pozitif olmalıdır.'); positive(i.simTime, 'Süre pozitif olmalıdır.');
      const data = heatTransferTransient({ T0: i.temp + i.dT, T_inf: i.temp, mCp: i.mCp, U: i.U, A: i.area, simTime: i.simTime, points: 201 });
      return { data, x: 't', series: [{ key: 'T', label: 'T(t)' }], xLabel: 'Zaman [s]', yLabel: 'Sıcaklık [K]', Q0: heatTransferQ({ U: i.U, A: i.area, dT: i.dT }), timeConst: i.mCp / (i.U * i.area) };
    }
    case 'equilibrium': {
      positive(i.temp, 'Sıcaklık pozitif olmalıdır.'); positive(i.C0, 'A₀ pozitif olmalıdır.');
      return { ...equilibriumCompute({ deltaG: i.deltaG, T: i.temp, A0: i.C0 }), static: true };
    }
    default:
      throw new Error('Bilinmeyen simülasyon tipi');
  }
}

export default function DynamicsPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  }

  // Accepts explicit inputs so example loaders don't compute with the previous render's values.
  function calculate(current = inputs) {
    setError('');
    try {
      const res = simulate(current);
      setResults({ ...res, simType: current.simType, inputs: { ...current } });
      saveHistory(`Dinamik — ${SIM_TYPES.find(s => s.value === current.simType).short}`, { 'C₀': current.C0, k: current.kDyn, Süre: current.simTime }, res.static ? `K = ${fmt(res.K, 4)}` : `${res.data.length} nokta`);
    } catch (err) {
      setResults(null);
      setError(err.message);
    }
  }

  function loadExample() {
    const next = { ...inputs, simType: 'cstr', C0: 1.0, kDyn: 0.1, tau: 40, v: 0.1, simTime: 200, n: 3 };
    setInputs(next);
    calculate(next);
  }

  const chartData = useMemo(() => {
    if (!results || results.static) return null;
    const step = Math.max(1, Math.floor(results.data.length / 200));
    const rows = results.data.filter((_, idx) => idx % step === 0);
    return {
      labels: rows.map(r => Number(Number(r[results.x]).toPrecision(4))),
      datasets: results.series.map(s => ({ label: s.label, data: rows.map(r => r[s.key]) })),
    };
  }, [results]);

  const t = inputs.simType;
  const f = (label, name, unit, extra) => <Field key={name} label={label} unit={unit} name={name} value={inputs[name]} onChange={handleChange} {...extra} />;

  return (
    <>
      <Head><title>Dinamik Simülasyon · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Reaksiyon Mühendisliği"
          title="Dinamik Simülasyon"
          lead="Analitik çözümler ve RK4 integrasyonu ile reaktör, enzim kinetiği ve ısıl sistemlerin zamana bağlı davranışı."
        />
        <div className="split">
          <form onSubmit={e => { e.preventDefault(); calculate(); }} noValidate>
            <Section title="Simülasyon" icon="⏱️">
              <FormGrid>
                <SelectField className="span-all" label="Model" name="simType" value={t} onChange={e => { handleChange(e); setResults(null); }} options={SIM_TYPES} />
                {['dynamic', 'cstr', 'pfr'].includes(t) && f('Besleme/başlangıç derişimi C₀', 'C0', 'mol/L')}
                {['dynamic', 'cstr', 'pfr'].includes(t) && f('Hız sabiti k', 'kDyn', '1/s')}
                {t === 'cstr' && f('Kalış süresi τ', 'tau', 's')}
                {t === 'cstr' && f('Hacimsel debi v₀', 'v', 'm³/s', { hint: 'Hacim hesabı için (isteğe bağlı)' })}
                {t === 'cstr' && f('Seri CSTR sayısı n', 'n', '–', { step: 1, min: 1 })}
                {t === 'pfr' && f('Reaktör hacmi V', 'V', 'm³')}
                {t === 'pfr' && f('Hacimsel debi Q', 'Q', 'm³/s')}
                {t === 'multicomponent' && f('A₀', 'C0', 'mol/L')}
                {t === 'multicomponent' && f('k₁ (A → B)', 'kA', '1/s')}
                {t === 'multicomponent' && f('k₂ (B → C)', 'kB', '1/s')}
                {t === 'michaelis' && f('Vmax', 'Vmax', 'mol/(L·s)')}
                {t === 'michaelis' && f('Km', 'Km', 'mol/L')}
                {t === 'michaelis' && f('Başlangıç substratı S₀', 'S0', 'mol/L')}
                {t === 'heattransfer' && f('Ortam sıcaklığı T∞', 'temp', 'K')}
                {t === 'heattransfer' && f('Başlangıç farkı T₀ − T∞', 'dT', 'K')}
                {t === 'heattransfer' && f('U', 'U', 'W/(m²·K)')}
                {t === 'heattransfer' && f('Alan A', 'area', 'm²')}
                {t === 'heattransfer' && f('Isıl kütle m·cₚ', 'mCp', 'J/K')}
                {t === 'equilibrium' && f('ΔG°', 'deltaG', 'kJ/mol')}
                {t === 'equilibrium' && f('Sıcaklık T', 'temp', 'K')}
                {t === 'equilibrium' && f('A₀', 'C0', 'mol/L')}
                {t !== 'pfr' && t !== 'equilibrium' && f('Simülasyon süresi', 'simTime', 's')}
              </FormGrid>
              <ButtonRow>
                <button type="submit">Simüle et</button>
                <button type="button" className="btn-secondary" onClick={loadExample}>LibreTexts CSTR örneği</button>
              </ButtonRow>
            </Section>
          </form>

          <div aria-live="polite">
            {error && <Alert type="error">{error}</Alert>}
            {!results ? <EmptyState icon="⏱️" title="Simülasyon sonuçları burada görünecek" /> : (
              <>
                <Section
                  title="Sonuçlar"
                  icon="📊"
                  description={SIM_TYPES.find(s => s.value === results.simType).label}
                  actions={!results.static && (
                    <button type="button" className="btn-secondary btn-sm"
                      onClick={() => downloadCSV(`simulasyon_${results.simType}.csv`, Object.keys(results.data[0]), results.data.map(r => Object.values(r)))}>
                      CSV indir
                    </button>
                  )}
                >
                  <ResultStats r={results} />
                </Section>
                {chartData && (
                  <Section title="Zaman profili" icon="📈">
                    <ChartClient data={chartData} xLabel={results.xLabel} yLabel={results.yLabel} />
                  </Section>
                )}
                {results.simType === 'cstr' && (
                  <Section title="Seri CSTR’ler (kararlı hâl)" icon="🔗" description="Her biri aynı τ’ya sahip eşit hacimli tanklar">
                    <DataTable
                      columns={[{ key: 'n', label: 'Tank', digits: 0 }, { key: 'C', label: 'Çıkış derişimi' }, { key: 'X', label: 'Toplam dönüşüm' }]}
                      rows={results.steady}
                    />
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ResultStats({ r }) {
  switch (r.simType) {
    case 'dynamic':
      return <StatGrid><Stat primary label="Yarılanma süresi" value={r.half} unit="s" /><Stat label="Son derişim" value={r.data[r.data.length - 1].C} /></StatGrid>;
    case 'cstr':
      return (
        <StatGrid>
          <Stat primary label="Kararlı hâl çıkışı" value={r.Css} digits={4} />
          <Stat label="Tek tank dönüşümü" value={r.X1} digits={4} />
          <Stat label="%95 yerleşme süresi" value={r.t95} unit="s" digits={1} />
          {r.V != null && <Stat label="Tank hacmi" value={r.V} unit="m³" />}
          {r.V != null && r.n > 1 && <Stat label={`Toplam hacim (${r.n} tank)`} value={r.V * r.n} unit="m³" />}
        </StatGrid>
      );
    case 'pfr':
      return <StatGrid><Stat primary label="Çıkış derişimi" value={r.Cout} digits={5} /><Stat label="Dönüşüm" value={r.X} digits={4} /><Stat label="Uzay zamanı τ" value={r.tau} unit="s" /></StatGrid>;
    case 'multicomponent':
      return <StatGrid><Stat primary label="Maks. B derişimi" value={r.Bmax} digits={4} />{r.tMax != null && <Stat label="B’nin tepe zamanı" value={r.tMax} unit="s" digits={2} />}</StatGrid>;
    case 'michaelis':
      return <StatGrid><Stat primary label="Başlangıç hızı v₀" value={r.v0} unit="mol/(L·s)" digits={4} /><Stat label="Son substrat" value={r.data[r.data.length - 1].S} digits={4} /></StatGrid>;
    case 'heattransfer':
      return <StatGrid><Stat primary label="Zaman sabiti m·cₚ/(UA)" value={r.timeConst} unit="s" /><Stat label="Başlangıç ısı akışı" value={r.Q0} unit="W" digits={1} /><Stat label="Son sıcaklık" value={r.data[r.data.length - 1].T} unit="K" digits={2} /></StatGrid>;
    case 'equilibrium':
      return <StatGrid><Stat primary label="K = e^(−ΔG°/RT)" value={r.K} digits={4} /><Stat label="[A] dengede" value={r.Aeq} digits={4} /><Stat label="[B] dengede" value={r.Beq} digits={4} /></StatGrid>;
    default:
      return null;
  }
}
