import React, { useState, useRef, useEffect } from 'react';
import ChartClient from '../components/ChartClient';
import { calculateReactorss } from '../src/lib/reactorss';

const defaultInputs = {
  prodName: 'Allyl Klorür',
  prodMolarMass: 76.5,
  prodStoich: 1,
  reactAName: 'Propylene',
  reactAStoich: 1,
  reactBName: 'Chlorine',
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
  const [chartTab, setChartTab] = useState('rate');
  const [sliderIdx, setSliderIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [normalize, setNormalize] = useState(false);
  const [useAbsoluteConc, setUseAbsoluteConc] = useState(false);
  const playRef = useRef(null);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? Number(value) : value }));
  }

  function calculateReactor() {
    const computed = calculateReactorss(inputs);
    setResults(computed);
  }

  function downloadCSV(filename, headers, rows) {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Özelleştirilebilir Reaktör Tasarımı Hesaplaması</h1>
      <form onSubmit={e => { e.preventDefault(); calculateReactor(); }}>
        <Section title="Ürün Bilgileri">
          <InputRow label="Ürün Adı:" name="prodName" value={inputs.prodName} onChange={handleChange} type="text" />
          <InputRow label="Ürün Molar Kütlesi (kg/kmol):" name="prodMolarMass" value={inputs.prodMolarMass} onChange={handleChange} />
          <InputRow label="Ürün Stoikiometrik Katsayısı (c):" name="prodStoich" value={inputs.prodStoich} onChange={handleChange} />
        </Section>
        <Section title="Reaktan A Bilgileri">
          <InputRow label="Reaktan A Adı:" name="reactAName" value={inputs.reactAName} onChange={handleChange} type="text" />
          <InputRow label="Reaktan A Stoikiometrik Katsayısı (a):" name="reactAStoich" value={inputs.reactAStoich} onChange={handleChange} />
        </Section>
        <Section title="Reaktan B Bilgileri">
          <InputRow label="Reaktan B Adı:" name="reactBName" value={inputs.reactBName} onChange={handleChange} type="text" />
          <InputRow label="Reaktan B Stoikiometrik Katsayısı (b):" name="reactBStoich" value={inputs.reactBStoich} onChange={handleChange} />
        </Section>
        <Section title="Proses ve Reaksiyon Koşulları">
          <InputRow label="Dönüş (X, ondalık; örn: 0.3 = %30):" name="conversion" value={inputs.conversion} step="0.01" onChange={handleChange} />
          <InputRow label="Yıllık Üretim (ton/yıl):" name="annualProd" value={inputs.annualProd} onChange={handleChange} />
          <InputRow label="Yıllık Çalışma Saati (h):" name="opHours" value={inputs.opHours} onChange={handleChange} />
          <InputRow label="Reaksiyon Sıcaklığı (K):" name="reactionTemp" value={inputs.reactionTemp} onChange={handleChange} />
          <InputRow label="Toplam Basınç (atm):" name="P_total" value={inputs.P_total} onChange={handleChange} />
        </Section>
        <Section title="Reaksiyon Kinetiği Parametreleri">
          <InputRow label="Ön Faktör, k₀ [kmol/(kg_cat·s·atm²)]:" name="k0" value={inputs.k0} onChange={handleChange} />
          <InputRow label="Aktivasyon Enerjisi, E (kJ/mol):" name="E" value={inputs.E} onChange={handleChange} />
          <InputRow label="Limitleyici Reaktanın Reaksiyon Sırası (nₗ):" name="orderLim" value={inputs.orderLim} onChange={handleChange} />
          <InputRow label="Fazladan Reaktanın Reaksiyon Sırası (nₑ):" name="orderExc" value={inputs.orderExc} onChange={handleChange} />
        </Section>
        <Section title="Feed ve Stoikiometri">
          <InputRow label="Feed Oranı (Fazladan reaktan / Limitleyici reaktan, r):" name="feedRatio" value={inputs.feedRatio} onChange={handleChange} />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
            <label htmlFor="limiting" style={{ flex: '1 0 300px', fontWeight: 500 }}>Limitleyici Reaktan Seçimi:</label>
            <select id="limiting" name="limiting" value={inputs.limiting} onChange={handleChange} style={{ flex: '1 0 150px', padding: 5, border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}>
              <option value="A">Reaktan A</option>
              <option value="B">Reaktan B</option>
            </select>
          </div>
        </Section>
        <button type="submit" style={{ width: 200, margin: '20px auto', display: 'block' }}>Hesaplamayı Yap</button>
      </form>
      {results && <ReactorResults results={results} />}
      {results && results.Xpoints && results.rpoints && (
        <div style={{ marginTop: 24 }}>
          <h3>Reaksiyon Profilleri</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <button onClick={() => setChartTab('rate')} style={{ background: chartTab === 'rate' ? '#007bff' : '#f1f1f1', color: chartTab === 'rate' ? 'white' : '#495057', border: 'none', padding: '8px 12px' }}>Hız (r)</button>
            <button onClick={() => setChartTab('conc')} style={{ background: chartTab === 'conc' ? '#007bff' : '#f1f1f1', color: chartTab === 'conc' ? 'white' : '#495057', border: 'none', padding: '8px 12px' }}>Konsantrasyon</button>
            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} /> Normalize</label>
            <label style={{ marginLeft: 8 }}><input type="checkbox" checked={useAbsoluteConc} onChange={e => setUseAbsoluteConc(e.target.checked)} /> Mutlak Konsantrasyon (kmol/h)</label>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { setIsPlaying(p => !p); }} style={{ padding: '6px 10px' }}>{isPlaying ? 'Pause' : 'Play'}</button>
            </div>
          </div>
          <div style={{ height: 320 }}>
            {chartTab === 'rate' && (
              <ChartClient
                type="line"
                data={{ labels: results.Xpoints, datasets: [{ label: 'r(X)', data: normalize ? results.rpoints.map(v => v / Math.max(...results.rpoints)) : results.rpoints, borderColor: 'rgb(75,192,192)', tension: 0.1, fill: false }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { verticalLine: { index: sliderIdx, color: 'rgba(255,99,132,0.9)', lineWidth: 1 } }, scales: { x: { title: { display: true, text: 'Dönüşüm X' } }, y: { type: 'linear', title: { display: true, text: 'Reaksiyon Hızı' } } } }}
              />
            )}
            {chartTab === 'conc' && (
              <ChartClient
                type="line"
                data={{ labels: results.Xpoints, datasets: useAbsoluteConc ? [{ label: 'Limitleyici (kmol/h)', data: results.concLim_kmolh, borderColor: 'rgb(255,99,132)', tension: 0.1, fill: false }, { label: 'Fazladan (kmol/h)', data: results.concExc_kmolh, borderColor: 'rgb(54,162,235)', tension: 0.1, fill: false }] : [{ label: 'Limitleyici Konsantrasyon (mol frac)', data: results.concLim, borderColor: 'rgb(255,99,132)', tension: 0.1, fill: false }, { label: 'Fazladan Konsantrasyon', data: results.concExc, borderColor: 'rgb(54,162,235)', tension: 0.1, fill: false }] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { verticalLine: { index: sliderIdx, color: 'rgba(255,99,132,0.9)', lineWidth: 1 } }, scales: { x: { title: { display: true, text: 'Dönüşüm X' } }, y: { title: { display: true, text: useAbsoluteConc ? 'kmol/h' : 'Molar Fraksiyon' } } } }}
              />
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => downloadCSV('reactorss_profile.csv', ['X', 'r'], results.Xpoints.map((x, i) => [x, results.rpoints[i]]))}>CSV İndir</button>
          </div>
        </div>
      )}
      {/* Advanced visualization + step-by-step analysis */}
      {results && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3>Gelişmiş Görselleştirme & Adım Adım Analiz</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, '@media (max-width: 768px)': { gridTemplateColumns: '1fr', gap: 16 } }}>
            <div>
              <h4>Hesaplama Özeti</h4>
              <table className="table-modern">
                <tbody>
                  <tr><td style={{ padding: 6 }}>Saatlik Üretim (kmol/h)</td><td style={{ padding: 6 }}>{results.prodKmolH.toFixed(3)}</td></tr>
                  <tr><td style={{ padding: 6 }}>Limitleyici Akış F₀ (kmol/h)</td><td style={{ padding: 6 }}>{results.F0_lim.toFixed(3)}</td></tr>
                  <tr><td style={{ padding: 6 }}>Fazladan Akış (kmol/h)</td><td style={{ padding: 6 }}>{results.F0_exc.toFixed(3)}</td></tr>
                  <tr><td style={{ padding: 6 }}>Katalizör Miktarı W (kg)</td><td style={{ padding: 6 }}>{results.W.toFixed(3)}</td></tr>
                  {results._diag && (
                    <>
                      <tr><td style={{ padding: 6 }}>k (s⁻¹) örnek (k_val)</td><td style={{ padding: 6 }}>{results._diag.k_val ? results._diag.k_val.toExponential(3) : '-'}</td></tr>
                      <tr><td style={{ padding: 6 }}>k (h⁻¹) (k_h)</td><td style={{ padding: 6 }}>{results._diag.k_h ? results._diag.k_h.toExponential(3) : '-'}</td></tr>
                      <tr><td style={{ padding: 6 }}>r min / max</td><td style={{ padding: 6 }}>{results._diag.rMin.toExponential(3)} / {results._diag.rMax.toExponential(3)}</td></tr>
                      {results._diag.warning && <tr><td style={{ padding: 6 }}>Uyarı</td><td style={{ padding: 6, color: 'darkred' }}>{results._diag.warning}</td></tr>}
                    </>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', marginBottom: 6 }}>Dönüşüm seçici (X):</label>
                <input type="range" min={0} max={Math.max(0, (results.Xpoints || []).length - 1)} value={sliderIdx} onChange={e => setSliderIdx(Number(e.target.value))} style={{ width: '100%' }} />
                <div style={{ marginTop: 8 }}>
                  <strong>Seçilen X:</strong> {results.Xpoints && results.Xpoints[sliderIdx] !== undefined ? results.Xpoints[sliderIdx].toFixed(4) : '-'}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>r(X):</strong> {results.rpoints && results.rpoints[sliderIdx] !== undefined ? Number(results.rpoints[sliderIdx]).toExponential(3) : '-'}
                </div>
                <div style={{ marginTop: 8 }}>
                  <strong>Limitleyici mol fraksiyonu:</strong> {results.concLim && results.concLim[sliderIdx] !== undefined ? results.concLim[sliderIdx].toFixed(3) : '-'}
                </div>
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: 360 }}>
              <h4>Reaktör Şeması</h4>
              <div style={{ padding: 10, border: '1px solid #eee', borderRadius: 6, textAlign: 'center' }}>
                {/* Simple SVG diagram with labels */}
                <svg width="320" height="140" viewBox="0 0 320 140">
                  <rect x="40" y="40" width="240" height="60" fill="none" stroke="#007bff" strokeWidth="2" rx="4" />
                  <polygon points="20,70 40,60 40,80" fill="#007bff" />
                  <polygon points="300,70 280,60 280,80" fill="#007bff" />
                  <text x="160" y="75" textAnchor="middle" fill="#333">Özelleştirilebilir Reaktör</text>
                  <text x="10" y="70" textAnchor="end" fill="#333">Giriş</text>
                  <text x="310" y="70" textAnchor="start" fill="#333">Çıkış</text>
                  {/* indicator bubble showing current X */}
                  {results.Xpoints && results.Xpoints[sliderIdx] !== undefined && (
                    <g>
                      <circle cx={40 + (results.Xpoints[sliderIdx] / Math.max(1, results.Xpoints[results.Xpoints.length - 1])) * 240} cy="70" r="6" fill="#ff9900" />
                      <text x={40 + (results.Xpoints[sliderIdx] / Math.max(1, results.Xpoints[results.Xpoints.length - 1])) * 240} y="40" textAnchor="middle" fill="#333">X={results.Xpoints[sliderIdx].toFixed(2)}</text>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h4>Adım Adım Hesaplama</h4>
            <ol>
              <li>Yıllık üretim → saatlik üretim hesaplandı: <strong>{results.prodKmolH.toFixed(3)} kmol/h</strong>.</li>
              <li>Limitleyici reaktanın F₀ hesaplandı: <strong>{results.F0_lim.toFixed(3)} kmol/h</strong>.</li>
              <li>Fazladan reaktanın akışı: <strong>{results.F0_exc.toFixed(3)} kmol/h</strong>.</li>
              <li>Katalizör ihtiyacı trapezoidal entegrasyon ile hesaplandı: <strong>W = {results.W.toFixed(3)} kg</strong>.</li>
            </ol>
          </div>
        </div>
      )}
      <div className="note" style={{ fontSize: '0.9em', color: '#666', marginTop: 20 }}>
        <strong>Hesaplama Adımları (Özet):</strong><br />
        1. Yıllık üretim ton→kg→kmol/yıl ve kmol/h cinsine dönüştürülür.<br />
        2. Limitleyici reaktanın feed akımı; eğer limitleyici reaktan A ise: F₀₍A₎ = (Üretim [kmol/h] × (a/c)) / X, limitleyici B için benzer şekilde hesaplanır.<br />
        3. Feed olarak limitleyici reaktanın mol oranı 1, fazladan reaktanın oranı girilen feed oranı (r) alınır.<br />
        4. Reaksiyon ilerledikçe (X değişkeni) reaktanların kısmi basınçları, stoikiometrik tüketim göz önüne alınarak hesaplanır.<br />
        5. Arrhenius denklemiyle k = k₀·exp(–E/(R·T)) hesaplanır, k saatlik forma çevrilir.<br />
        6. Reaksiyon hızı fonksiyonu: r(X) = k_h · [P_lim(X)]^(nₗ) · [P_ex(X)]^(nₑ) şeklinde alınır.<br />
        7. Katalizör miktarı: W = ∫₀^(X) [F₀_lim / r(X)] dX, trapezoidal entegrasyonla sayısal olarak hesaplanır.
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

function InputRow({ label, name, value, onChange, type = 'number', ...rest }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label htmlFor={name} style={{ color: '#2D3748', display: 'block', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={{ width: '100%', padding: 12, marginTop: 5, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }}
        {...rest}
      />
    </div>
  );
}

function ReactorResults({ results }) {
  return (
    <div className="result" style={{ marginTop: 20, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 4, borderLeft: '4px solid #00539C' }}>
      <p><strong>{results.prodName}</strong> üretimi için gerekli katalizör miktarı: {results.W.toFixed(2)} kg ({(results.W / 1000).toFixed(2)} ton)</p>
      <p>Saatlik Üretim: {results.prodKmolH.toFixed(3)} kmol/h</p>
      <p>Limitleyici Reaktan: {results.limitingName}</p>
      <p>Limitleyici Akış: {results.F0_lim.toFixed(2)} kmol/h</p>
      <p>Fazladan Akış: {results.F0_exc.toFixed(2)} kmol/h</p>
    </div>
  );
}
