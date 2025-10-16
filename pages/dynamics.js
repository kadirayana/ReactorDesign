import { useState, useMemo } from 'react';
import P5Client from '../components/P5Client'
import ResultsTable from '../components/ResultsTable'
const dyn = require('../src/lib/dynamics')

const simTypes = [
  { value: 'dynamic', label: 'Dinamik Simülasyon (C(t)=C₀e^(–kt))' },
  { value: 'cstr', label: 'CSTR Simülasyonu' },
  { value: 'pfr', label: 'PFR Simülasyonu' },
  { value: 'equilibrium', label: 'Kimyasal Denge Hesaplaması' },
  { value: 'heattransfer', label: 'Isı Transfer Hesaplaması' },
  { value: 'michaelis', label: 'Michaelis-Menten Kinetik Simülasyonu' },
  { value: 'multicomponent', label: 'Çok Bileşenli Sistem Simülasyonu (A→B)' },
];

const defaultInputs = {
  simType: 'dynamic',
  C0: 1.0,
  kDyn: 0.1,
  simTime: 50,
  tau: 10,
  v: 0.1,
  n: 1,
  Q: 0.01,
  deltaG: -10,
  temp: 298,
  dT: 20,
  area: 5,
  U: 100,
  Vmax: 1,
  Km: 0.5,
  S0: 1.0,
  kA: 0.1,
  kB: 0.05,
};

export default function DynamicsPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? Number(value) : value }));
  }

  function calculate() {
    setError(null);
    const { simType, C0, kDyn, simTime, tau, Q, deltaG, temp, dT, area, U, Vmax, Km, S0, kA, kB } = inputs;
    // basic validation
    if (!isFinite(C0) || C0 <= 0) { setError('Lütfen geçerli pozitif Başlangıç Konsantrasyonu C₀ giriniz.'); return }
    if (!isFinite(kDyn) || kDyn <= 0) { setError('Lütfen geçerli pozitif hız sabiti k giriniz.'); return }
    if (!isFinite(simTime) || simTime <= 0) { setError('Lütfen geçerli pozitif Simülasyon Süresi giriniz.'); return }
    // simType specific validation
    if (simType === 'cstr') {
      if (!isFinite(tau) || tau <= 0) { setError('CSTR için geçerli pozitif Rezidans Zamanı (τ) giriniz.'); return }
    }
    if (simType === 'pfr') {
      if (!isFinite(Q) || Q <= 0) { setError('PFR için geçerli pozitif Volumetrik Akış (Q) giriniz.'); return }
      if (!isFinite(simTime) || simTime <= 0) { setError('PFR için geçerli pozitif Reaktör Hacmi (V) giriniz.'); return }
    }
    if (simType === 'equilibrium') {
      if (!isFinite(temp) || temp <= 0) { setError('Denge hesabı için geçerli pozitif sıcaklık (T) giriniz.'); return }
      if (!isFinite(deltaG)) { setError('Denge hesabı için geçerli ΔG değeri giriniz.'); return }
    }
    if (simType === 'heattransfer') {
      if (!isFinite(area) || area <= 0) { setError('Isı transferi için geçerli pozitif alan (A) giriniz.'); return }
      if (!isFinite(U) || U <= 0) { setError('Isı transferi için geçerli pozitif U değeri giriniz.'); return }
      if (!isFinite(dT)) { setError('Isı transferi için geçerli ΔT değeri giriniz.'); return }
    }
    if (simType === 'michaelis') {
      if (!isFinite(Vmax) || Vmax <= 0) { setError('Michaelis için geçerli pozitif Vmax giriniz.'); return }
      if (!isFinite(Km) || Km <= 0) { setError('Michaelis için geçerli pozitif Km giriniz.'); return }
    }
    if (simType === 'multicomponent') {
      if (!isFinite(kA) || kA < 0) { setError('Çok bileşenli için geçerli kA değeri giriniz.'); return }
      if (!isFinite(kB) || kB < 0) { setError('Çok bileşenli için geçerli kB değeri giriniz.'); return }
    }
    let res = {};
    if (simType === 'dynamic') {
      res = { type: 'dynamic', data: dyn.dynamicSeries({ C0, k: kDyn, simTime, points: 51 }) };
    } else if (simType === 'cstr') {
      const series = dyn.cstrSeries({ C0, k: kDyn, tau, simTime, points: 201 })
      const C_out = series[series.length - 1].C
      const X = (C0 - C_out) / C0
      const V = (inputs.v && isFinite(inputs.v) && inputs.v > 0) ? tau * inputs.v : null
      // compute steady-state series for n reactors in series (analytic)
      const n = Number(inputs.n) || 1
      const seriesSteady = []
      for (let i = 1; i <= n; i++) {
        const Cn = C0 / Math.pow(1 + kDyn * tau, i)
        const Xn = (C0 - Cn) / C0
        seriesSteady.push({ n: i, Cn, Xn })
      }
      const V_total = (V && n > 0) ? V * n : null
      res = { type: 'cstr', data: series, C_out, X, V, seriesSteady, V_total };
    } else if (simType === 'pfr') {
      // PFR as series over reactor volume -> normalize to t for plotting (use V as t)
      const raw = dyn.pfrSeries({ C0, k: kDyn, V: simTime, Q, points: 101 })
      const data = raw.map(r => ({ t: r.V, C: r.C }))
      res = { type: 'pfr', data, C_out: data[data.length - 1].C };
    } else if (simType === 'equilibrium') {
      const eq = dyn.equilibriumCompute({ deltaG, T: temp, A0: C0 })
      res = { type: 'equilibrium', ...eq };
    } else if (simType === 'heattransfer') {
      const series = dyn.heatTransferTransient({ T0: temp + dT, T_inf: temp, mCp: 1000, U, A: area, simTime, points: 101 })
      const Qval = dyn.heatTransferQ({ U, A: area, dT })
      res = { type: 'heattransfer', data: series, Qval };
    } else if (simType === 'michaelis') {
      const series = dyn.michaelisSeries({ Vmax, Km, S0, simTime, points: 201 })
      const v = (Vmax * S0) / (Km + S0)
      res = { type: 'michaelis', data: series, v };
    } else if (simType === 'multicomponent') {
      res = { type: 'multicomponent', data: dyn.multicomponentSeriesAdvanced({ C0, kA, kB, simTime, points: 201 }) };
    }

    setResults(res);
      // persist a summary to localStorage (similar to legacy page behavior)
    try {
      const kayit = { tip: simType, C0, kDyn, simTime, tarih: new Date().toISOString() };
      const hesaplamalar = JSON.parse(window.localStorage.getItem('hesaplamalar') || '[]');
      hesaplamalar.push(kayit);
      window.localStorage.setItem('hesaplamalar', JSON.stringify(hesaplamalar));
    } catch (e) {
      // localStorage may be unavailable in some environments; ignore silently
    }
  }

  function loadLibreTextsExample() {
    // example from LibreTexts: k=0.1 1/s, v=0.1 m3/s, desired X=0.8 -> tau ~40 s (we set tau=40)
    const example = { simType: 'cstr', C0: 1.0, kDyn: 0.1, tau: 40, v: 0.1, simTime: 200, n: 3 }
    setInputs(i => ({ ...i, ...example }))
    // run calculation after state update; use setTimeout to ensure state has applied
    setTimeout(() => calculate(), 50)
  }

  // Dynamic form fields
  function renderFields() {
    switch (inputs.simType) {
      case 'dynamic':
        return <>
          <InputRow label="Başlangıç Konsantrasyonu C₀:" name="C0" value={inputs.C0} onChange={handleChange} />
          <InputRow label="Hız Sabiti k [1/s]:" name="kDyn" value={inputs.kDyn} onChange={handleChange} />
          <InputRow label="Simülasyon Süresi [s]:" name="simTime" value={inputs.simTime} onChange={handleChange} />
        </>;
      case 'cstr':
        return <>
          <InputRow label="Başlangıç Konsantrasyonu C₀:" name="C0" value={inputs.C0} onChange={handleChange} />
          <InputRow label="Hız Sabiti k [1/s]:" name="kDyn" value={inputs.kDyn} onChange={handleChange} />
          <InputRow label="Rezidans Zamanı (τ) [s]:" name="tau" value={inputs.tau} onChange={handleChange} />
          <InputRow label="Volumetrik Akış (v₀) [m³/s]:" name="v" value={inputs.v} onChange={handleChange} />
          <InputRow label="Seri Reaktör Sayısı (n):" name="n" value={inputs.n} onChange={handleChange} />
        </>;
      case 'pfr':
        return <>
          <InputRow label="Başlangıç Konsantrasyonu C₀:" name="C0" value={inputs.C0} onChange={handleChange} />
          <InputRow label="Hız Sabiti k [1/s]:" name="kDyn" value={inputs.kDyn} onChange={handleChange} />
          <InputRow label="Reaktör Hacmi (V) [m³]:" name="simTime" value={inputs.simTime} onChange={handleChange} />
          <InputRow label="Volumetrik Akış (Q) [m³/s]:" name="Q" value={inputs.Q} onChange={handleChange} />
        </>;
      case 'equilibrium':
        return <>
          <InputRow label="ΔG (kJ/mol):" name="deltaG" value={inputs.deltaG} onChange={handleChange} />
          <InputRow label="Sıcaklık (T) [K]:" name="temp" value={inputs.temp} onChange={handleChange} />
        </>;
      case 'heattransfer':
        return <>
          <InputRow label="Sıcaklık Farkı (ΔT) [K]:" name="dT" value={inputs.dT} onChange={handleChange} />
          <InputRow label="Alan (A) [m²]:" name="area" value={inputs.area} onChange={handleChange} />
          <InputRow label="Isı Transfer Katsayısı (U) [W/m²K]:" name="U" value={inputs.U} onChange={handleChange} />
        </>;
      case 'michaelis':
        return <>
          <InputRow label="Vmax:" name="Vmax" value={inputs.Vmax} onChange={handleChange} />
          <InputRow label="Km:" name="Km" value={inputs.Km} onChange={handleChange} />
          <InputRow label="Başlangıç Substrat (S₀):" name="S0" value={inputs.S0} onChange={handleChange} />
        </>;
      case 'multicomponent':
        return <>
          <InputRow label="Başlangıç Konsantrasyonu (A₀, B₀):" name="C0" value={inputs.C0} onChange={handleChange} />
          <InputRow label="kA [1/s]:" name="kA" value={inputs.kA} onChange={handleChange} />
          <InputRow label="kB [1/s]:" name="kB" value={inputs.kB} onChange={handleChange} />
          <InputRow label="Simülasyon Süresi [s]:" name="simTime" value={inputs.simTime} onChange={handleChange} />
        </>;
      default:
        return null;
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Dinamik Sistem Simülasyonu</h1>
      <form onSubmit={e => { e.preventDefault(); calculate(); }}>
        <div style={{ marginBottom: 16, marginTop: 24, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
          <label htmlFor="simType" style={{ fontWeight: 500, marginBottom: 8, display: 'block', color: '#2D3748' }}>Simülasyon Türü:</label>
          <select id="simType" name="simType" value={inputs.simType} onChange={handleChange} style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd' }}>
            {simTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {renderFields()}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
          <button type="submit" style={{ width: 160 }}>Hesapla</button>
          <button type="button" onClick={loadLibreTextsExample} style={{ width: 220 }}>LibreTexts Örneğini Yükle (CSTR)</button>
        </div>
      </form>
      {/* Accessible live region for result messages */}
      <div aria-live="polite" aria-atomic="true">
        {error && <div role="alert" style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
        {results && <DynamicsResults results={results} />}
        {/* p5 visualization for series data (dynamic, multicomponent, pfr) */}
        {results && results.data && (
          <div style={{ marginTop: 24 }}>
            <h3>Simülasyon Grafiği</h3>
            <div style={{ border: '1px solid #ddd', padding: 10, borderRadius: 6 }}>
              <P5Client sketch={makeSketch(results)} />
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 32, background: '#f8f9fa', borderRadius: 8, minHeight: 120, textAlign: 'center', padding: 24 }}>
        <strong>Grafik ve tablo görselleştirmeleri yakında eklenecek.</strong>
      </div>
    </div>
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

function DynamicsResults({ results }) {
  if (results.type === 'dynamic') {
    return (
        <div style={{ background: '#f1fdf4', border: '1px solid #c3e9cb', borderLeft: '4px solid #51CF66', padding: 20, borderRadius: 8, marginTop: 20 }}>
          <h2 style={{ color: '#00539C', fontSize: 20, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>C(t) = C₀e^(–kt) Sonuçları</h2>
          <ResultsTable data={results.data} />
        </div>
      );
  } else if (results.type === 'cstr') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>CSTR Sonucu</h2>
        <p><strong>C_out:</strong> {results.C_out.toFixed(4)}</p>
        <p><strong>Dönüşüm (X):</strong> {results.X != null ? results.X.toFixed(4) : '—'}</p>
        {results.V != null && <p><strong>Tek Reaktör Hacmi (V):</strong> {results.V.toFixed(4)} m³</p>}
        {results.V_total != null && <p><strong>Toplam Hacim (n·V):</strong> {results.V_total.toFixed(4)} m³</p>}
        {results.seriesSteady && (
          <div style={{ marginTop: 12 }}>
            <h3>Seri CSTR (steady-state) Sonuçları</h3>
            <ResultsTable data={results.seriesSteady.map(s => ({ n: s.n, C: s.Cn, X: s.Xn }))} />
          </div>
        )}
      </div>
    );
  } else if (results.type === 'pfr') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>PFR Sonucu</h2>
        <p><strong>C_out:</strong> {results.C_out.toFixed(4)}</p>
      </div>
    );
  } else if (results.type === 'equilibrium') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>Kimyasal Denge Sonucu</h2>
        <p><strong>K:</strong> {results.K.toExponential(4)}</p>
      </div>
    );
  } else if (results.type === 'heattransfer') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>Isı Transferi Sonucu</h2>
        <p><strong>Q:</strong> {Number.isFinite(results.Qval) ? results.Qval.toFixed(2) + ' W' : '—'}</p>
      </div>
    );
  } else if (results.type === 'michaelis') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>Michaelis-Menten Sonucu</h2>
        <p><strong>v:</strong> {Number.isFinite(results.v) ? results.v.toFixed(4) : '—'}</p>
      </div>
    );
  } else if (results.type === 'multicomponent') {
    return (
      <div style={{ background: '#e9f5ff', border: '1px solid #b3d7ff', padding: 20, borderRadius: 8, marginTop: 20 }}>
        <h2>Çok Bileşenli Sistem Sonuçları</h2>
        <ResultsTable data={results.data} />
      </div>
    );
  }
  return null;
}

// p5 sketch factory: accepts results object and returns a p5 sketch function
function makeSketch(results) {
  return function (p) {
    let padding = 50
    let series = results.data || []
    p.setup = function () {
      // responsive size from container helper if present
      const size = (p._getContainerSize && p._getContainerSize()) || { w: 600, h: 300 }
      p.createCanvas(size.w, size.h)
      p.frameRate(30)
    }
    p.draw = function () {
      // if container helper exists, ensure canvas matches
      try {
        if (p._getContainerSize && p.resizeCanvas) {
          const s = p._getContainerSize()
          if (p.width !== s.w || p.height !== s.h) p.resizeCanvas(s.w, s.h)
        }
      } catch (e) {}

      p.background(255)
      p.stroke(0)
      // axes
      p.line(padding, p.height - padding, p.width - padding, p.height - padding)
      p.line(padding, padding, padding, p.height - padding)

      if (!series || series.length === 0) return

      // determine x domain t, and y domain depending on keys
      const tMax = series[series.length - 1].t || 1
      // determine which keys to plot besides t
      const keys = Object.keys(series[0]).filter(k => k !== 't')
      // compute y min/max across keys
      let yMin = Infinity, yMax = -Infinity
      series.forEach(row => {
        keys.forEach(k => {
          const v = Number(row[k])
          if (!Number.isFinite(v)) return
          if (v < yMin) yMin = v
          if (v > yMax) yMax = v
        })
      })
      if (yMin === Infinity) return
      // padding for axis
      const plotW = p.width - padding * 2
      const plotH = p.height - padding * 2

      const colors = [p.color(255, 0, 0), p.color(0, 128, 0), p.color(0, 0, 255)]

      keys.forEach((key, ki) => {
        p.noFill()
        p.stroke(colors[ki % colors.length])
        p.beginShape()
        for (let i = 0; i < series.length; i++) {
          const row = series[i]
          const t = row.t || (i / (series.length - 1)) * tMax
          const x = p.map(t, 0, tMax, padding, padding + plotW)
          const v = Number(row[key])
          const y = p.map(v, yMin, yMax, padding + plotH, padding)
          p.vertex(x, y)
        }
        p.endShape()
      })

      // draw labels
      p.fill(0)
      p.noStroke()
      p.textSize(12)
      p.text('t', p.width - padding + 6, p.height - padding + 4)
      p.push()
      p.translate(12, p.height / 2)
      p.rotate(-p.HALF_PI)
      p.text('C (konc.)', 0, 0)
      p.pop()

      // legend
      p.push()
      p.textSize(12)
      const legendX = p.width - padding - 120
      const legendY = padding
      keys.forEach((key, ki) => {
        const col = colors[ki % colors.length]
        p.fill(col)
        p.noStroke()
        p.rect(legendX, legendY + ki * 18 - 10, 12, 12)
        p.fill(0)
        p.text(key, legendX + 18, legendY + ki * 18)
      })
      p.pop()
    }
  }
}
