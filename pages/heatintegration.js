import { useState } from 'react';
import dynamic from 'next/dynamic';
import { computePinch } from '../src/lib/heatintegration';
const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

const defaultInputs = {
  deltaTmin: 20,
  C1_CP: 40, C1_in: 20, C1_out: 160,
  C2_CP: 60, C2_in: 120, C2_out: 260,
  H1_CP: 50, H1_in: 280, H1_out: 60,
  H2_CP: 30, H2_in: 180, H2_out: 20,
};

export default function HeatIntegrationPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: Number(value) }));
  }

  function calculateHeatIntegration() {
    setError(null);
    try {
      const { deltaTmin, C1_CP, C1_in, C1_out, C2_CP, C2_in, C2_out, H1_CP, H1_in, H1_out, H2_CP, H2_in, H2_out } = inputs;

      // Basic validation
      if (!deltaTmin || deltaTmin <= 0) throw new Error('ΔTmin pozitif bir sayı olmalı');
      const streams = {
        coldStreams: [
          { CP: C1_CP, in: C1_in, out: C1_out },
          { CP: C2_CP, in: C2_in, out: C2_out }
        ],
        hotStreams: [
          { CP: H1_CP, in: H1_in, out: H1_out },
          { CP: H2_CP, in: H2_in, out: H2_out }
        ]
      };

      // Ensure CP are numbers >= 0
      [...streams.coldStreams, ...streams.hotStreams].forEach(s => {
        if (typeof s.CP !== 'number' || Number.isNaN(s.CP) || s.CP < 0) throw new Error('CP değerleri negatif olamaz ve sayı olmalı');
      });

      const res = computePinch({ ...streams, deltaTmin });
      setResults(res);
    } catch (err) {
      setResults(null);
      setError(err.message || String(err));
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Isı Entegrasyonu Hesaplaması</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>İki soğuk ve iki sıcak akış için ΔTmin ve akış verilerini girin. Pinç noktası ve minimum utility yükleri hesaplanır.</p>
      <form onSubmit={e => { e.preventDefault(); calculateHeatIntegration(); }}>
        <Section title="ΔTmin Değeri">
          <InputRow label="ΔTmin (°C):" name="deltaTmin" value={inputs.deltaTmin} onChange={handleChange} />
        </Section>
        <Section title="Soğuk Akışlar">
          <h3>Akış C1</h3>
          <InputRow label="Isı Kapasite Akışı (HCFR, kJ/s°C):" name="C1_CP" value={inputs.C1_CP} onChange={handleChange} />
          <InputRow label="Giriş Sıcaklığı (°C):" name="C1_in" value={inputs.C1_in} onChange={handleChange} />
          <InputRow label="Çıkış Sıcaklığı (°C):" name="C1_out" value={inputs.C1_out} onChange={handleChange} />
          <h3>Akış C2</h3>
          <InputRow label="Isı Kapasite Akışı (kJ/s°C):" name="C2_CP" value={inputs.C2_CP} onChange={handleChange} />
          <InputRow label="Giriş Sıcaklığı (°C):" name="C2_in" value={inputs.C2_in} onChange={handleChange} />
          <InputRow label="Çıkış Sıcaklığı (°C):" name="C2_out" value={inputs.C2_out} onChange={handleChange} />
        </Section>
        <Section title="Sıcak Akışlar">
          <h3>Akış H1</h3>
          <InputRow label="Isı Kapasite Akışı (kJ/s°C):" name="H1_CP" value={inputs.H1_CP} onChange={handleChange} />
          <InputRow label="Giriş Sıcaklığı (°C):" name="H1_in" value={inputs.H1_in} onChange={handleChange} />
          <InputRow label="Çıkış Sıcaklığı (°C):" name="H1_out" value={inputs.H1_out} onChange={handleChange} />
          <h3>Akış H2</h3>
          <InputRow label="Isı Kapasite Akışı (kJ/s°C):" name="H2_CP" value={inputs.H2_CP} onChange={handleChange} />
          <InputRow label="Giriş Sıcaklığı (°C):" name="H2_in" value={inputs.H2_in} onChange={handleChange} />
          <InputRow label="Çıkış Sıcaklığı (°C):" name="H2_out" value={inputs.H2_out} onChange={handleChange} />
        </Section>
        {error && <div style={{ color: 'crimson', marginTop: 12 }}><strong>Hata:</strong> {error}</div>}
        <button type="submit" style={{ width: 200, margin: '20px auto', display: 'block' }}>Hesaplamayı Yap</button>
      </form>
      {results && <HeatIntegrationResults results={results} />}
      <div style={{ marginTop: 32, background: '#f8f9fa', borderRadius: 8, minHeight: 200, textAlign: 'center', padding: 24 }}>
        {results ? (
          <>
            <h3>Isı Profili ve Cascade</h3>
            <div style={{ marginTop: 8 }}>
              <ChartClient
                data={buildChartData(results)}
                options={buildChartOptions(results)}
                type="line"
                height={350}
              />
            </div>
          </>
        ) : (
          <strong>Isı profili grafiği hesaplandıktan sonra burada gösterilecektir.</strong>
        )}
      </div>
      <div className="note" style={{ fontSize: '0.9em', color: '#555', marginTop: 20 }}>
        <strong>Hesaplama Adımları (Özet):</strong><br />
        1. ΔTmin/2 değeri (shift) hesaplanır.<br />
        2. Soğuk akışlar için giriş ve çıkış sıcaklıklarına shift eklenir, sıcak akışlar için çıkarılır.<br />
        3. Tüm kaydırılmış sıcaklıklar tekrarsız alınır ve büyükten küçüğe sıralanır.<br />
        4. Her sıcaklık aralığında, o aralıkta aktif olan akışların ısı kapasite akışları toplanır (sıcak: pozitif, soğuk: negatif).<br />
        5. Cascade yöntemiyle kademeli ısı akışı hesaplanır, minimum değer bulunur (pinç noktasını gösterir).<br />
        6. Eğer minimum değer negatifse, mutlak değeri hot utility olarak, son değeri ise cold utility olarak raporlanır.<br />
        7. Pinç noktasının orijinal sıcaklık değeri, kaydırılmış değerden shift çıkarılarak bulunur.<br />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="card">
      <legend style={{ color: '#00539C', padding: '0 10px', fontWeight: 600, fontSize: 16, fontFamily: "'Poppins', sans-serif" }}>{title}</legend>
      {children}
    </fieldset>
  );
}

function InputRow({ label, name, value, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label htmlFor={name} style={{ display: 'block', marginTop: 10, fontWeight: 500, color: '#2D3748' }}>{label}</label>
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: 12, marginTop: 5, border: '1px solid #ddd', borderRadius: 6 }}
      />
    </div>
  );
}

function HeatIntegrationResults({ results }) {
  return (
    <div className="card-highlight">
      <h2 style={{ fontSize: 20, color: '#00539C', fontFamily: "'Poppins', sans-serif", fontWeight: 600, marginBottom: 16 }}>Sonuçlar</h2>
      <p style={{ marginBottom: 12 }}><strong>Minimum Hot Utility:</strong> {results.hotUtility.toFixed(2)} kJ/s</p>
      <p style={{ marginBottom: 12 }}><strong>Minimum Cold Utility:</strong> {results.coldUtility.toFixed(2)} kJ/s</p>
      <p><strong>Pinç Noktası Sıcaklığı:</strong> {results.pinch !== null ? results.pinch.toFixed(2) + ' °C' : 'Hesaplanamadı'}</p>
    </div>
  );
}

// buildChartData: create Chart.js data object from computePinch results
function buildChartData(results) {
  // Use tempsAscending for x-axis (unshifted, ascending temps)
  const labels = results.tempsAscending.map(t => t.toFixed(2));

  // Build stepwise composite hot and cold CP arrays matching labels intervals
  // For N labels, there are N-1 intervals. We'll map each interval to a point at the midpoint label.
  const intervalMidTemps = results.intervals.map(it => ((it.T_high + it.T_low) / 2) - (results.pinch !== null ? 0 : 0));
  const hotCP = results.intervals.map(it => it.hotCP);
  const coldCP = results.intervals.map(it => it.coldCP);

  // For cascade plot, use cascade values aligned with temps (cascade length = intervals+1)
  const cascade = results.cascade;

  // Prepare datasets: cascade mapped to temps (descending order in results.temps, so map accordingly)
  const tempsDescending = results.temps; // shifted descending
  const cascadeLabels = tempsDescending.map(t => (t - (results.pinch != null ? 0 : 0)).toFixed(2));

  // prepare step arrays aligned with cascade labels length
  const hotSeries = results.intervals.map(it => Number(it.hotCP.toFixed(4))).concat([0]);
  const coldSeries = results.intervals.map(it => Number(it.coldCP.toFixed(4))).concat([0]);
  const cascadeSeries = cascade.map(v => Number(v.toFixed(4)));

  // pinch index on shifted descending temps
  const pinchIndex = results.temps.indexOf(results.pinchShifted);

  const datasets = [
    {
      label: 'Cascade Q (kJ/s)',
      data: cascadeSeries,
      borderColor: 'rgb(220,53,69)',
      backgroundColor: 'rgba(220,53,69,0.08)',
      tension: 0.2,
      yAxisID: 'y'
    },
    {
      label: 'Hot CP (kJ/s°C)',
      data: hotSeries,
      borderColor: 'rgb(255,159,64)',
      backgroundColor: 'rgba(255,159,64,0.08)',
      stepped: true,
      fill: false,
      yAxisID: 'y2'
    },
    {
      label: 'Cold CP (kJ/s°C)',
      data: coldSeries,
      borderColor: 'rgb(0,123,255)',
      backgroundColor: 'rgba(0,123,255,0.08)',
      stepped: true,
      fill: false,
      yAxisID: 'y2'
    }
  ];

  // Add pinch marker dataset if pinch is known
  if (pinchIndex >= 0) {
    const pinchData = new Array(cascadeSeries.length).fill(null);
    pinchData[pinchIndex] = cascadeSeries[pinchIndex];
    datasets.push({
      label: 'Pinç Noktası',
      data: pinchData,
      pointRadius: 6,
      pointBackgroundColor: 'black',
      showLine: false,
      yAxisID: 'y'
    });
  }

  return { labels: cascadeLabels, datasets };
}

function buildChartOptions(results) {
  const pinchIndex = results.temps.indexOf(results.pinchShifted);
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { type: 'linear', position: 'left', title: { display: true, text: 'Q (kJ/s)' } },
      y2: { type: 'linear', position: 'right', title: { display: true, text: 'CP (kJ/s°C)' }, grid: { drawOnChartArea: false } }
    },
    plugins: {
      legend: { position: 'top' },
      verticalLine: { index: pinchIndex, color: 'rgba(0,0,0,0.6)', lineWidth: 1, dash: [4, 4] }
    }
  };
}
