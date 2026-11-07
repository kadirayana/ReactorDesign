import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, SelectField, ButtonRow, Alert,
  StatGrid, Stat, EmptyState, Tabs, DataTable, fmt,
} from '../components/ui';
import { equilibriumSolve, solveTemperature } from '../src/lib/chemicalSolver';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const R = 8.314462618; // J/(mol·K)

// Which species take part in each reaction template
const reactionTypes = [
  { value: 'aA+bB=cC+dD', label: 'aA + bB ⇌ cC + dD', species: ['A', 'B', 'C', 'D'] },
  { value: 'aA+bB=cC', label: 'aA + bB ⇌ cC', species: ['A', 'B', 'C'] },
  { value: 'aA=bB+cC', label: 'aA ⇌ cC + dD', species: ['A', 'C', 'D'] },
  { value: 'aA=bB', label: 'aA ⇌ cC', species: ['A', 'C'] },
];

const SPECIES_INFO = {
  A: { coef: 'coefA', conc: 'concA', role: 'reaktan' },
  B: { coef: 'coefB', conc: 'concB', role: 'reaktan' },
  C: { coef: 'coefC', conc: 'concC', role: 'ürün' },
  D: { coef: 'coefD', conc: 'concD', role: 'ürün' },
};

const defaultInputs = {
  reactionType: 'aA+bB=cC+dD',
  coefA: 1, coefB: 1, coefC: 1, coefD: 1,
  concA: 1.0, concB: 1.0, concC: 0.0, concD: 0.0,
  equilibriumConstant: 10,
  temperature: 298.15,
  deltaH0: -40,
  deltaS0: -50,
};

export default function ChemicalPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [mode, setMode] = useState('equilibrium');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const species = reactionTypes.find(r => r.value === inputs.reactionType).species;

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  }

  // Species not in the chosen template get a zero coefficient
  function activeInputs() {
    const out = { ...inputs };
    Object.entries(SPECIES_INFO).forEach(([s, info]) => {
      if (!species.includes(s)) { out[info.coef] = 0; out[info.conc] = 0; }
    });
    return out;
  }

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      if (mode === 'equilibrium') {
        const a = activeInputs();
        const res = equilibriumSolve(a);
        setResults({ mode, ...res, inputs: a });
        saveHistory('Kimyasal denge', { K: a.equilibriumConstant, 'A₀': a.concA, 'B₀': a.concB }, `ξ = ${fmt(res.x, 4)} mol/L`);
      } else if (mode === 'temperature') {
        const T = solveTemperature(inputs);
        setResults({ mode, T, inputs: { ...inputs } });
        saveHistory('Denge sıcaklığı', { K: inputs.equilibriumConstant, 'ΔH°': `${inputs.deltaH0} kJ/mol`, 'ΔS°': `${inputs.deltaS0} J/(mol·K)` }, `T = ${fmt(T, 2)} K`);
      } else {
        const T = Number(inputs.temperature);
        if (!(T > 0)) throw new Error('Sıcaklık pozitif olmalıdır.');
        const dG = Number(inputs.deltaH0) * 1000 - T * Number(inputs.deltaS0); // J/mol
        const K_HS = Math.exp(-dG / (R * T));
        const K = Number(inputs.equilibriumConstant);
        const dG_K = K > 0 ? -R * T * Math.log(K) : NaN;
        // K(T) curve from the van 't Hoff relation with constant ΔH°, ΔS°
        const Ts = Array.from({ length: 41 }, (_, i) => Math.max(1, T * (0.5 + i / 40)));
        const curve = Ts.map(t => Math.log(Math.exp(-(Number(inputs.deltaH0) * 1000 - t * Number(inputs.deltaS0)) / (R * t))));
        setResults({ mode, T, dG, K_HS, dG_K, Ts, curve, inputs: { ...inputs } });
      }
    } catch (err) {
      setResults(null);
      setError(err.message);
    }
  }

  const eqChart = useMemo(() => {
    if (!results || results.mode !== 'equilibrium') return null;
    const a = results.inputs;
    const lo = Math.min(0, results.minExtent);
    const hi = results.maxExtent;
    const n = 80;
    const xs = Array.from({ length: n + 1 }, (_, i) => lo + (i / n) * (hi - lo));
    const nearest = xs.reduce((best, x, i) => (Math.abs(x - results.x) < Math.abs(xs[best] - results.x) ? i : best), 0);
    const conc = { A: x => a.concA - a.coefA * x, B: x => a.concB - a.coefB * x, C: x => a.concC + a.coefC * x, D: x => a.concD + a.coefD * x };
    return {
      data: {
        labels: xs.map(x => Number(x.toFixed(4))),
        datasets: species.map(s => ({ label: s, data: xs.map(x => Math.max(0, conc[s](x))) })),
      },
      options: { plugins: { verticalLine: { index: nearest } } },
    };
  }, [results, species]);

  return (
    <>
      <Head><title>Kimyasal Denge · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Reaksiyon Mühendisliği"
          title="Kimyasal Denge"
          lead="Derişim tabanlı denge sabiti K = Π[ürün]^ν / Π[reaktan]^ν ile denge bileşimi; ΔH° ve ΔS°’den denge sıcaklığı ve Gibbs enerjisi."
        />

        <Tabs
          value={mode}
          onChange={m => { setMode(m); setResults(null); setError(''); }}
          tabs={[
            { value: 'equilibrium', label: 'Denge bileşimi' },
            { value: 'temperature', label: 'Denge sıcaklığı' },
            { value: 'thermodynamics', label: 'Termodinamik' },
          ]}
        />

        <div className="split">
          <form onSubmit={calculate} noValidate>
            {mode === 'equilibrium' && (
              <Section title="Reaksiyon" icon="⚖️">
                <FormGrid>
                  <SelectField className="span-all" label="Reaksiyon şablonu" name="reactionType" value={inputs.reactionType} onChange={handleChange} options={reactionTypes} />
                  {species.map(s => (
                    <Field key={`c-${s}`} label={`${s} katsayısı`} hint={SPECIES_INFO[s].role} name={SPECIES_INFO[s].coef} value={inputs[SPECIES_INFO[s].coef]} onChange={handleChange} />
                  ))}
                  {species.map(s => (
                    <Field key={`n-${s}`} label={`${s}₀ başlangıç`} unit="mol/L" name={SPECIES_INFO[s].conc} value={inputs[SPECIES_INFO[s].conc]} onChange={handleChange} />
                  ))}
                  <Field className="span-all" label="Denge sabiti K" name="equilibriumConstant" value={inputs.equilibriumConstant} onChange={handleChange} />
                </FormGrid>
                <ButtonRow><button type="submit">Dengeyi hesapla</button></ButtonRow>
              </Section>
            )}

            {mode !== 'equilibrium' && (
              <Section title="Termodinamik veriler" icon="🔥" description="ΔH° ve ΔS° sıcaklıktan bağımsız kabul edilir.">
                <FormGrid>
                  <Field label="ΔH°" unit="kJ/mol" name="deltaH0" value={inputs.deltaH0} onChange={handleChange} />
                  <Field label="ΔS°" unit="J/(mol·K)" name="deltaS0" value={inputs.deltaS0} onChange={handleChange} />
                  {mode === 'temperature'
                    ? <Field label="Hedef K" name="equilibriumConstant" value={inputs.equilibriumConstant} onChange={handleChange} />
                    : (
                      <>
                        <Field label="Sıcaklık T" unit="K" name="temperature" value={inputs.temperature} onChange={handleChange} />
                        <Field label="Karşılaştırma için K" name="equilibriumConstant" value={inputs.equilibriumConstant} onChange={handleChange} hint="İsteğe bağlı" />
                      </>
                    )}
                </FormGrid>
                <ButtonRow><button type="submit">Hesapla</button></ButtonRow>
              </Section>
            )}
          </form>

          <div>
            {error && <Alert type="error">{error}</Alert>}
            {!results && !error && <EmptyState icon="⚖️" title="Sonuçlar burada görünecek" />}

            {results?.mode === 'equilibrium' && (
              <>
                <Section title="Denge bileşimi" icon="📊">
                  <StatGrid>
                    <Stat primary label="İlerleme derecesi ξ" value={results.x} unit="mol/L" digits={5} />
                    <Stat label="Hesaplanan K" value={results.Kcalc} digits={5} />
                    <Stat label="Yön" value={results.x >= 0 ? 'İleri →' : '← Geri'} raw />
                  </StatGrid>
                  <DataTable
                    columns={[
                      { key: 's', label: 'Tür', text: true },
                      { key: 'c0', label: 'Başlangıç [mol/L]' },
                      { key: 'ceq', label: 'Denge [mol/L]' },
                      { key: 'd', label: 'Değişim [mol/L]' },
                    ]}
                    rows={species.map(s => {
                      const c0 = results.inputs[SPECIES_INFO[s].conc];
                      const ceq = results[`eq${s}`];
                      return { s, c0, ceq, d: ceq - c0 };
                    })}
                  />
                  {results.x < 0 && <Alert type="info">Başlangıç karışımında ürünler dengeye göre fazla olduğu için reaksiyon geri yönde ilerler.</Alert>}
                </Section>
                <Section title="Derişim – ilerleme derecesi" icon="📈" description="Kesikli çizgi denge noktasını gösterir.">
                  <ChartClient data={eqChart.data} options={eqChart.options} xLabel="ξ [mol/L]" yLabel="Derişim [mol/L]" />
                </Section>
              </>
            )}

            {results?.mode === 'temperature' && (
              <Section title="Denge sıcaklığı" icon="🌡️">
                <StatGrid>
                  <Stat primary label="T" value={results.T} unit="K" digits={2} />
                  <Stat label="T" value={results.T - 273.15} unit="°C" digits={2} />
                </StatGrid>
                <div className="formula">T = ΔH° / (ΔS° − R·ln K)</div>
              </Section>
            )}

            {results?.mode === 'thermodynamics' && (
              <>
                <Section title={`T = ${fmt(results.T, 2)} K’de`} icon="🔥">
                  <StatGrid>
                    <Stat primary label="ΔG° = ΔH° − TΔS°" value={results.dG / 1000} unit="kJ/mol" digits={3} />
                    <Stat label="K = exp(−ΔG°/RT)" value={results.K_HS} digits={4} />
                    {Number.isFinite(results.dG_K) && <Stat label="ΔG° (girilen K’den)" value={results.dG_K / 1000} unit="kJ/mol" digits={3} />}
                  </StatGrid>
                  <p className="small muted">
                    {results.dG < 0 ? 'ΔG° < 0: standart koşullarda ürünler lehine (K > 1).' : 'ΔG° > 0: standart koşullarda reaktanlar lehine (K < 1).'}
                  </p>
                </Section>
                <Section title="ln K – sıcaklık (van ’t Hoff)" icon="📈">
                  <ChartClient
                    data={{ labels: results.Ts.map(t => Number(t.toFixed(1))), datasets: [{ label: 'ln K', data: results.curve }] }}
                    xLabel="T [K]"
                    yLabel="ln K"
                  />
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
