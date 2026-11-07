import { useMemo, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, Field, ButtonRow, Alert, StatGrid, Stat, EmptyState, Tabs, DataTable, fmt,
} from '../components/ui';
import { compositeCurves } from '../src/lib/heatintegration';
import { saveHistory } from '../src/lib/history';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const DEFAULT_STREAMS = [
  { id: 1, name: 'H1', type: 'hot', CP: 50, in: 280, out: 60 },
  { id: 2, name: 'H2', type: 'hot', CP: 30, in: 180, out: 20 },
  { id: 3, name: 'C1', type: 'cold', CP: 40, in: 20, out: 160 },
  { id: 4, name: 'C2', type: 'cold', CP: 60, in: 120, out: 260 },
];

let nextId = 100;

export default function HeatIntegrationPage() {
  const [streams, setStreams] = useState(DEFAULT_STREAMS);
  const [deltaTmin, setDeltaTmin] = useState(20);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [chartTab, setChartTab] = useState('composite');

  function update(id, key, value) {
    setStreams(list => list.map(s => (s.id === id ? { ...s, [key]: key === 'name' || key === 'type' ? value : (value === '' ? '' : Number(value)) } : s)));
  }

  function addStream(type) {
    const count = streams.filter(s => s.type === type).length + 1;
    setStreams(list => [...list, { id: nextId++, name: `${type === 'hot' ? 'H' : 'C'}${count}`, type, CP: 10, in: type === 'hot' ? 150 : 30, out: type === 'hot' ? 50 : 120 }]);
  }

  function calculate(e) {
    e?.preventDefault();
    setError('');
    try {
      const dT = Number(deltaTmin);
      if (!(dT > 0)) throw new Error('ΔTmin pozitif olmalıdır.');
      streams.forEach(s => {
        if (!(s.CP > 0)) throw new Error(`${s.name}: CP pozitif olmalıdır.`);
        if (s.type === 'hot' && !(s.in > s.out)) throw new Error(`${s.name}: sıcak akışta giriş sıcaklığı çıkıştan yüksek olmalıdır.`);
        if (s.type === 'cold' && !(s.out > s.in)) throw new Error(`${s.name}: soğuk akışta çıkış sıcaklığı girişten yüksek olmalıdır.`);
      });
      const hotStreams = streams.filter(s => s.type === 'hot');
      const coldStreams = streams.filter(s => s.type === 'cold');
      if (!hotStreams.length || !coldStreams.length) throw new Error('En az bir sıcak ve bir soğuk akış gereklidir.');
      const res = compositeCurves({ hotStreams, coldStreams, deltaTmin: dT });
      setResults({ ...res, deltaTmin: dT, shift: dT / 2 });
      saveHistory('Isı entegrasyonu', { Akış: streams.length, ΔTmin: `${dT} °C` }, `Qh,min = ${fmt(res.hotUtility, 1)} kW`);
    } catch (err) {
      setResults(null);
      setError(err.message);
    }
  }

  const chart = useMemo(() => {
    if (!results) return null;
    if (chartTab === 'composite') {
      return {
        data: {
          datasets: [
            { label: 'Sıcak bileşik eğri', data: results.hot.map(p => ({ x: p.H, y: p.T })), showLine: true },
            { label: 'Soğuk bileşik eğri', data: results.cold.map(p => ({ x: p.H, y: p.T })), showLine: true },
          ],
        },
        x: 'Entalpi H [kW]',
        y: 'Sıcaklık T [°C]',
      };
    }
    return {
      data: { datasets: [{ label: 'Büyük bileşik eğri', data: results.grand.map(p => ({ x: p.H, y: p.T })), showLine: true, tension: 0 }] },
      x: 'Net ısı akışı [kW]',
      y: 'Kaydırılmış sıcaklık T* [°C]',
    };
  }, [results, chartTab]);

  return (
    <>
      <Head><title>Isı Entegrasyonu · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Isı ve Kütle Transferi"
          title="Isı Entegrasyonu (Pinç Analizi)"
          lead="Problem tablosu algoritmasıyla minimum sıcak/soğuk utility ihtiyacı, pinç sıcaklığı, bileşik eğriler ve büyük bileşik eğri."
        />

        <form onSubmit={calculate} noValidate>
          <Section
            title="Akış tablosu"
            icon="🔥"
            description="CP = ṁ·cₚ [kW/K]. İstediğiniz kadar akış ekleyebilirsiniz."
            actions={(
              <>
                <button type="button" className="btn-secondary btn-sm" onClick={() => addStream('hot')}>+ Sıcak akış</button>
                <button type="button" className="btn-secondary btn-sm" onClick={() => addStream('cold')}>+ Soğuk akış</button>
              </>
            )}
          >
            <div className="table-wrap">
              <table className="stream-table">
                <thead>
                  <tr>
                    <th>Akış</th>
                    <th>Tip</th>
                    <th className="num">CP [kW/K]</th>
                    <th className="num">T giriş [°C]</th>
                    <th className="num">T çıkış [°C]</th>
                    <th className="num">Yük [kW]</th>
                    <th aria-label="Sil" />
                  </tr>
                </thead>
                <tbody>
                  {streams.map(s => (
                    <tr key={s.id}>
                      <td><input aria-label="Akış adı" value={s.name} onChange={e => update(s.id, 'name', e.target.value)} /></td>
                      <td>
                        <select aria-label="Akış tipi" value={s.type} onChange={e => update(s.id, 'type', e.target.value)}>
                          <option value="hot">Sıcak</option>
                          <option value="cold">Soğuk</option>
                        </select>
                      </td>
                      <td><input type="number" step="any" aria-label="CP" value={s.CP} onChange={e => update(s.id, 'CP', e.target.value)} /></td>
                      <td><input type="number" step="any" aria-label="Giriş sıcaklığı" value={s.in} onChange={e => update(s.id, 'in', e.target.value)} /></td>
                      <td><input type="number" step="any" aria-label="Çıkış sıcaklığı" value={s.out} onChange={e => update(s.id, 'out', e.target.value)} /></td>
                      <td className="num">
                        <span className={`badge ${s.type === 'hot' ? 'badge-error' : ''}`}>{fmt(Math.abs((s.in - s.out) * s.CP), 1)}</span>
                      </td>
                      <td>
                        <button type="button" className="btn-ghost btn-sm" aria-label={`${s.name} akışını sil`} onClick={() => setStreams(list => list.filter(x => x.id !== s.id))}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-row" style={{ alignItems: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 220 }}>
                <Field label="ΔTmin" unit="°C" name="deltaTmin" value={deltaTmin} onChange={e => setDeltaTmin(e.target.value === '' ? '' : Number(e.target.value))} />
              </div>
              <ButtonRow>
                <button type="submit">Pinç analizini yap</button>
                <button type="button" className="btn-secondary" onClick={() => { setStreams(DEFAULT_STREAMS); setResults(null); }}>Örnek veriye dön</button>
              </ButtonRow>
            </div>
          </Section>
        </form>

        {error && <Alert type="error">{error}</Alert>}

        {!results ? (
          <EmptyState icon="📉" title="Pinç analizi sonuçları burada görünecek">Bileşik eğriler ve problem tablosu kaskadı.</EmptyState>
        ) : (
          <>
            <Section title="Hedefler" icon="🎯">
              <StatGrid>
                <Stat primary label="Minimum sıcak utility" value={results.hotUtility} unit="kW" digits={1} />
                <Stat primary label="Minimum soğuk utility" value={results.coldUtility} unit="kW" digits={1} />
                <Stat label="Maks. ısı geri kazanımı" value={results.maxRecovery} unit="kW" digits={1} />
                <Stat label="Pinç (sıcak taraf)" value={results.pinch != null ? results.pinch + results.deltaTmin : null} unit="°C" digits={1} />
                <Stat label="Pinç (soğuk taraf)" value={results.pinch} unit="°C" digits={1} />
              </StatGrid>
              <p className="small muted">Pinçin üstünde yalnızca sıcak utility, altında yalnızca soğuk utility kullanılmalı; pinçten ısı aktarılmamalıdır.</p>
            </Section>

            <Section title="Eğriler" icon="📈">
              <Tabs value={chartTab} onChange={setChartTab} tabs={[{ value: 'composite', label: 'Bileşik eğriler' }, { value: 'grand', label: 'Büyük bileşik eğri' }]} />
              <ChartClient type="scatter" data={chart.data} xLabel={chart.x} yLabel={chart.y} height={380} options={{ interaction: { mode: 'nearest', intersect: false } }} />
            </Section>

            <Section title="Problem tablosu" icon="🧮" description={`Kaydırılmış sıcaklıklar: sıcak − ${results.shift}, soğuk + ${results.shift} °C`}>
              <DataTable
                columns={[
                  { key: 'range', label: 'Aralık T* [°C]', text: true },
                  { key: 'dT', label: 'ΔT [°C]', digits: 2 },
                  { key: 'netCP', label: 'ΣCPh − ΣCPc [kW/K]', digits: 2 },
                  { key: 'Q', label: 'ΔH [kW]', digits: 1 },
                  { key: 'cascade', label: 'Kaskad [kW]', digits: 1 },
                ]}
                rows={results.intervals.map((it, i) => ({
                  range: `${fmt(it.T_high, 1)} → ${fmt(it.T_low, 1)}`,
                  dT: it.dT,
                  netCP: it.netCP,
                  Q: it.Q,
                  cascade: results.cascade[i + 1],
                }))}
              />
            </Section>
          </>
        )}
      </div>
    </>
  );
}
