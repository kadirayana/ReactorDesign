import { useCallback, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, ButtonRow, Alert, StatGrid, Stat, EmptyState, DataTable, fmt,
} from '../components/ui';
import { computeVaporizer } from '../src/lib/vaporizer';
import { downloadCSV } from '../src/lib/utils';
import { saveHistory } from '../src/lib/history';
import { buildVaporizerScene } from '../components/vaporizerScene';

const ThreeClient = dynamic(() => import('../components/ThreeClient'), { ssr: false });
const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const defaultInputs = {
  feedFlow: 503.32,
  vaporFraction: 0.3,
  T_feed_in: -45.3,
  T_feed_out: -37.9,
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
  iterations: 5,
};

export default function VaporizerPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: value === '' ? '' : Number(value) }));
  }

  function calculateDesign(e) {
    e?.preventDefault();
    const newErrors = [];
    if (!(inputs.feedFlow > 0)) newErrors.push('Besleme akışı pozitif olmalıdır.');
    if (!(inputs.vaporFraction >= 0 && inputs.vaporFraction <= 1)) newErrors.push('Buhar kesri 0 ile 1 arasında olmalıdır.');
    if (!(inputs.T_water_in > inputs.T_water_out)) newErrors.push('Su giriş sıcaklığı çıkıştan yüksek olmalıdır.');
    if (!(inputs.d0 > inputs.di && inputs.di > 0)) newErrors.push('Tüp dış çapı iç çaptan büyük olmalıdır.');
    if (!(inputs.iterations >= 1)) newErrors.push('İterasyon sayısı en az 1 olmalıdır.');
    setErrors(newErrors);
    if (newErrors.length) { setResults(null); return; }
    try {
      const computed = computeVaporizer(inputs);
      // unique key + inputs so the 3D viewer remounts with the new geometry
      setResults({ ...computed, _key: Date.now(), _inputs: { ...inputs } });
      const last = computed.iterationResults[computed.iterationResults.length - 1];
      saveHistory('Buharlaştırıcı', { Besleme: `${inputs.feedFlow} kmol/h`, 'Buhar kesri': inputs.vaporFraction }, `A = ${fmt(last.A, 1)} m², ${Math.round(last.N_tubes)} tüp`);
    } catch (err) {
      setErrors([err.message]);
      setResults(null);
    }
  }

  function exportCSV() {
    if (!results) return;
    const rows = [
      ['Q_toplam_kW', results.Q_total_kW],
      ['m_su_kg_s', results.m_water],
      ['LMTD_C', results.LMTD],
      ...results.iterationResults.flatMap(r => [
        [`iter${r.iteration}_U_W_m2K`, r.U],
        [`iter${r.iteration}_A_m2`, r.A],
        [`iter${r.iteration}_N_tup`, r.N_tubes],
      ]),
      ['Db_m', results.Db],
      ['Ds_m', results.Ds],
    ];
    downloadCSV('buharlastirici_sonuclar.csv', ['Parametre', 'Deger'], rows);
  }

  // memoised per result: a new function would rebuild the 3D scene on every render
  const initScene = useCallback(ctx => (results ? buildVaporizerScene(ctx, results) : undefined), [results]);

  const f = (label, name, unit, extra) => <Field key={name} label={label} unit={unit} name={name} value={inputs[name]} onChange={handleChange} {...extra} />;
  const last = results ? results.iterationResults[results.iterationResults.length - 1] : null;

  return (
    <>
      <Head><title>Buharlaştırıcı Tasarımı · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Isı ve Kütle Transferi"
          title="Buharlaştırıcı Tasarımı"
          lead="Kettle tipi buharlaştırıcı: tüp tarafında ısıtma suyu, gövde tarafında çekirdek kaynama (Mostinski). U iteratif olarak güncellenir; tüp demeti ve gövde çapı hesaplanır."
        />

        <form onSubmit={calculateDesign} noValidate>
          <div className="split split-even">
            <div>
              <Section title="Besleme ve proses" icon="🧪">
                <FormGrid>
                  {f('Besleme akışı', 'feedFlow', 'kmol/h')}
                  {f('Buharlaşan kesir', 'vaporFraction', '0–1', { step: 0.01 })}
                  {f('Besleme giriş sıcaklığı', 'T_feed_in', '°C')}
                  {f('Kaynama (çıkış) sıcaklığı', 'T_feed_out', '°C')}
                  {f('Çalışma basıncı', 'P_operating', 'bar')}
                  {f('Kritik basınç Pc', 'Pc_mix', 'bar')}
                  {f('Buharlaşma ısısı ΔHvap', 'dHvap_mix', 'kJ/kmol')}
                  {f('Sıvı ısı kapasitesi cₚ', 'Cp_mix', 'kJ/(kmol·K)')}
                </FormGrid>
              </Section>
              <Section title="Isıtma suyu (tüp tarafı)" icon="💧">
                <FormGrid>
                  {f('Su giriş sıcaklığı', 'T_water_in', '°C')}
                  {f('Su çıkış sıcaklığı', 'T_water_out', '°C')}
                  {f('Isıl iletkenlik k', 'k_water', 'W/(m·K)')}
                  {f('Isı kapasitesi cₚ', 'Cp_water', 'kJ/(kg·K)')}
                  {f('Yoğunluk ρ', 'rho_water', 'kg/m³')}
                  {f('Viskozite μ', 'mu_water', 'Pa·s')}
                </FormGrid>
              </Section>
            </div>
            <div>
              <Section title="Tüpler ve kirlenme" icon="🧰">
                <FormGrid>
                  {f('Tüp uzunluğu L', 'tubeLength', 'm')}
                  {f('Tüp dış çapı d₀', 'd0', 'm')}
                  {f('Tüp iç çapı dᵢ', 'di', 'm')}
                  {f('Tüp ısıl iletkenliği', 'k_tube', 'W/(m·K)')}
                  {f('Dış kirlenme Rf,o', 'Rf_o', 'm²·K/W')}
                  {f('İç kirlenme Rf,i', 'Rf_i', 'm²·K/W')}
                </FormGrid>
              </Section>
              <Section title="Çözücü" icon="🔁">
                <FormGrid>
                  {f('Başlangıç U tahmini', 'U_initial', 'W/(m²·K)')}
                  {f('Maks. iterasyon', 'iterations', '–', { step: 1, min: 1, max: 20 })}
                  {f('Serbest bölge yüksekliği', 'freeboard', 'm')}
                </FormGrid>
                <ButtonRow>
                  <button type="submit">Tasarımı hesapla</button>
                  <button type="button" className="btn-secondary" onClick={() => { setInputs(defaultInputs); setResults(null); setErrors([]); }}>Sıfırla</button>
                </ButtonRow>
              </Section>
            </div>
          </div>
        </form>

        {errors.length > 0 && (
          <Alert type="error" title="Hesaplanamadı:">
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{errors.map((er, idx) => <li key={idx}>{er}</li>)}</ul>
          </Alert>
        )}

        {!results ? (
          <EmptyState icon="🌫️" title="Tasarım sonuçları burada görünecek">Isı yükü, iterasyon geçmişi, tüp sayısı ve 3B demet görünümü.</EmptyState>
        ) : (
          <>
            <Section
              title="Tasarım özeti"
              icon="📊"
              actions={<button type="button" className="btn-secondary btn-sm" onClick={exportCSV}>CSV indir</button>}
            >
              <StatGrid>
                <Stat primary label="Isı yükü" value={results.Q_total_kW} unit="kW" digits={1} />
                <Stat primary label="Isı transfer alanı" value={last.A} unit="m²" digits={2} />
                <Stat label="Tüp sayısı" value={Math.ceil(last.N_tubes)} digits={0} />
                <Stat label="Hesaplanan U" value={last.U_calc} unit="W/(m²·K)" digits={0} />
                <Stat label="Su debisi" value={results.m_water} unit="kg/s" digits={2} />
                <Stat label="LMTD" value={results.LMTD} unit="°C" digits={2} />
                <Stat label="Demet çapı Db" value={results.Db} unit="m" digits={3} />
                <Stat label="Gövde çapı Ds" value={results.Ds} unit="m" digits={3} />
              </StatGrid>
              {!results.converged && <Alert type="warning">U yakınsamadı (son iterasyonda %{fmt(results.relativeUChange * 100, 1)} değişim). İterasyon sayısını artırın.</Alert>}
              {results.reWarning && <Alert type="warning">{results.reWarning}</Alert>}
              {results.packWarning && <Alert type="warning">{results.packWarning}</Alert>}
            </Section>

            <Section title="U iterasyonları" icon="🔁">
              <ChartClient
                data={{
                  labels: results.iterationResults.map(r => r.iteration),
                  datasets: [
                    { label: 'Varsayılan U', data: results.iterationResults.map(r => r.U) },
                    { label: 'Hesaplanan U', data: results.iterationResults.map(r => r.U_calc) },
                  ],
                }}
                xLabel="İterasyon"
                yLabel="U [W/(m²·K)]"
                height={260}
              />
              <DataTable
                columns={[
                  { key: 'iteration', label: '#', digits: 0 },
                  { key: 'U', label: 'U [W/m²K]', digits: 0 },
                  { key: 'A', label: 'A [m²]', digits: 2 },
                  { key: 'N_tubes', label: 'Tüp', digits: 0 },
                  { key: 'v_water', label: 'v [m/s]', digits: 2 },
                  { key: 'Re', label: 'Re', digits: 0 },
                  { key: 'h_i', label: 'hᵢ [W/m²K]', digits: 0 },
                  { key: 'h_nb', label: 'h_nb [W/m²K]', digits: 0 },
                  { key: 'U_calc', label: 'U hesap', digits: 0 },
                ]}
                rows={results.iterationResults}
              />
            </Section>

            <Section title="3B tüp demeti" icon="🧊" description="Sürükleyerek döndürün">
          <ThreeClient key={results._key} onInit={initScene} />
            </Section>
          </>
        )}
      </div>
    </>
  );
}
