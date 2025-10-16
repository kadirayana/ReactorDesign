import { useState } from 'react';
import ChartClient from '../components/ChartClient';
import { equilibriumSolve, solveTemperature } from '../src/lib/chemicalSolver';

const reactionTypes = [
  { value: 'aA+bB=cC+dD', label: 'aA + bB ⇌ cC + dD' },
  { value: 'aA+bB=cC', label: 'aA + bB ⇌ cC' },
  { value: 'aA=bB+cC', label: 'aA ⇌ bB + cC' },
  { value: 'aA=bB', label: 'aA ⇌ bB' },
];
const calculationTypes = [
  { value: 'equilibrium', label: 'Denge Konsantrasyonlarını Hesapla' },
  { value: 'temperature', label: 'Denge Sıcaklığını Hesapla' },
  { value: 'thermodynamics', label: 'Termodinamik Parametreleri Hesapla' },
];
const defaultInputs = {
  reactionType: 'aA+bB=cC+dD',
  coefA: 1, coefB: 1, coefC: 1, coefD: 1,
  concA: 1.0, concB: 1.0, concC: 0.0, concD: 0.0,
  equilibriumConstant: 10,
  temperature: 298,
  deltaH0: 0.0, // standard enthalpy change [kJ/mol]
  deltaS0: 0.0, // standard entropy change [J/mol/K]
  deltaG0: 0.0, // standard Gibbs energy [kJ/mol] (optional)
  pressure: 1.0,
  calculationType: 'equilibrium',
};

export default function ChemicalPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type } = e.target;
    setInputs(i => ({ ...i, [name]: type === 'number' ? Number(value) : value }));
  }

  function calculateEquilibrium() {
    setError(null);
    // basic validation
    if (!isFinite(inputs.equilibriumConstant) || inputs.equilibriumConstant <= 0) {
      setError('Lütfen geçerli ve pozitif bir denge sabiti (K) girin.');
      setResults(null);
      return;
    }
    if (!isFinite(inputs.temperature) || inputs.temperature <= 0) {
      setError('Geçerli bir sıcaklık (K) giriniz.');
      setResults(null);
      return;
    }
    try {
      const res = equilibriumSolve(inputs);
      setResults(res);
    } catch (err) {
      setResults(null);
      setError(String(err));
    }
  }

  function calculateTemperature() {
    // Solve for temperature where K matches van't Hoff relation using ΔH° and ΔS°
    // van't Hoff (approx): ln K = -ΔH°/(R T) + ΔS°/R  (ΔH° in J/mol, ΔS° in J/mol/K)
    const R = 8.314462618; // J/mol/K
    const { deltaH0, deltaS0, equilibriumConstant: K } = inputs;
    // Provided deltaH0 is in kJ/mol in the input; convert to J/mol if necessary
    const dH = Number(deltaH0) * 1000; // J/mol
    const dS = Number(deltaS0); // J/mol/K
    if (!K || K <= 0) { setError('Geçerli bir K değeri girin.'); setResults(null); return; }
    setError(null);
    try {
      const T = solveTemperature(inputs);
      setResults({ temperatureSolved: T, used: 'vanthoff_newton', K, deltaH0: deltaH0, deltaS0: deltaS0 });
    } catch (err) {
      setResults(null);
      setError(String(err));
    }
    
  }

  function calculateThermodynamics() {
    // Compute ΔG° from K (ΔG° = -RT ln K) and relate ΔG°, ΔH°, ΔS° when available
    const R = 8.314462618; // J/mol/K
    const { equilibriumConstant: K, temperature, deltaH0, deltaS0, deltaG0 } = inputs;
    const T = Number(temperature) || 298;
    const out = {};
    if (K && K > 0) {
      const dG = -R * T * Math.log(Number(K)); // J/mol
      out.deltaG_calc_Jpermol = dG;
      out.deltaG_calc_kJpermol = dG / 1000;
    }
    if (deltaH0 && deltaS0) {
      // If user gave ΔH° (kJ/mol) and ΔS° (J/mol/K), compute ΔG° = ΔH°*1000 - T*ΔS°
      const dH = Number(deltaH0) * 1000;
      const dS = Number(deltaS0);
      const dG_fromHS = dH - T * dS; // J/mol
      out.deltaG_from_HS_Jpermol = dG_fromHS;
      out.deltaG_from_HS_kJpermol = dG_fromHS / 1000;
    }
    if (deltaG0) {
      out.deltaG_user_kJpermol = Number(deltaG0);
    }
    setError(null);
    setResults({ thermodynamics: out, temperature: T });
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Kimyasal Denge Hesaplaması</h1>
      <form onSubmit={e => { e.preventDefault(); setError(null);
          if (inputs.calculationType === 'equilibrium') calculateEquilibrium();
          else if (inputs.calculationType === 'temperature') calculateTemperature();
          else if (inputs.calculationType === 'thermodynamics') calculateThermodynamics();
        }}>
        <Section title="Reaksiyon Tipi Seçin">
          <select name="reactionType" value={inputs.reactionType} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ced4da' }}>
            {reactionTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Section>
        <Section title="Stokiyometrik Katsayılar">
          <InputRow label="A Katsayısı (a):" name="coefA" value={inputs.coefA} onChange={handleChange} />
          <InputRow label="B Katsayısı (b):" name="coefB" value={inputs.coefB} onChange={handleChange} />
          <InputRow label="C Katsayısı (c):" name="coefC" value={inputs.coefC} onChange={handleChange} />
          <InputRow label="D Katsayısı (d):" name="coefD" value={inputs.coefD} onChange={handleChange} />
        </Section>
        <Section title="Giriş Parametreleri">
          <InputRow label="Başlangıç Konsantrasyonu A₀ [mol/L]:" name="concA" value={inputs.concA} onChange={handleChange} />
          <InputRow label="Başlangıç Konsantrasyonu B₀ [mol/L]:" name="concB" value={inputs.concB} onChange={handleChange} />
          <InputRow label="Başlangıç Konsantrasyonu C₀ [mol/L]:" name="concC" value={inputs.concC} onChange={handleChange} />
          <InputRow label="Başlangıç Konsantrasyonu D₀ [mol/L]:" name="concD" value={inputs.concD} onChange={handleChange} />
        </Section>
        <Section title="Denge Sabiti ve Koşullar">
          <InputRow label="Denge Sabiti (K):" name="equilibriumConstant" value={inputs.equilibriumConstant} onChange={handleChange} />
          <InputRow label="Sıcaklık [K]:" name="temperature" value={inputs.temperature} onChange={handleChange} />
          <InputRow label="Basınç [bar]:" name="pressure" value={inputs.pressure} onChange={handleChange} />
          <InputRow label="Standart ΔH° [kJ/mol] (giriş için):" name="deltaH0" value={inputs.deltaH0} onChange={handleChange} />
          <InputRow label="Standart ΔS° [J/mol/K] (giriş için):" name="deltaS0" value={inputs.deltaS0} onChange={handleChange} />
          <InputRow label="Standart ΔG° [kJ/mol] (opsiyonel):" name="deltaG0" value={inputs.deltaG0} onChange={handleChange} />
        </Section>
        <Section title="Hesaplama Tipi">
          <select name="calculationType" value={inputs.calculationType} onChange={handleChange} style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ced4da' }}>
            {calculationTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Section>
    <button type="submit" style={{ width: 200, margin: '20px auto', display: 'block' }}>Hesapla</button>
      </form>
    {error && <div style={{ marginTop: 12, color: 'crimson', fontWeight: 600 }}>{error}</div>}
    {results && <ChemicalResults results={results} inputs={inputs} />}
      <div style={{ marginTop: 32, background: '#f8f9fa', borderRadius: 8, minHeight: 120, textAlign: 'center', padding: 24 }}>
        <strong>Gelişmiş denge ve termodinamik hesaplamalar yakında eklenecek.</strong>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
      <h2 style={{ fontSize: 20, color: '#00539C', borderBottom: '2px solid #00539C', paddingBottom: 8, marginBottom: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>{title}</h2>
      {children}
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
        style={{ width: '100%', padding: 12, marginTop: 5, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' }}
      />
    </div>
  );
}

function ChemicalResults({ results, inputs }) {
  const hasEquilibrium = typeof results.eqA !== 'undefined' && results.eqA !== null;
  return (
    <div style={{ background: '#e9ecef', borderRadius: 4, padding: 15, marginTop: 20 }}>
      <h3>Sonuçlar</h3>
      {results.error && <div style={{ color: 'red', marginBottom: 10 }}>{results.error}</div>}
      {results.temperatureSolved && (
        <div style={{ marginBottom: 12 }}>
          <p><strong>Hesaplanan Denge Sıcaklığı (T):</strong> {Number(results.temperatureSolved).toFixed(2)} K</p>
          <p style={{ fontSize: 12, color: '#555' }}>Van't Hoff yaklaşımı kullanıldı. (ΔH°/ΔS° girişleri gereklidir.)</p>
        </div>
      )}
      {results.thermodynamics && (
        <div style={{ marginBottom: 12 }}>
          <h4>Termodinamik Hesaplamalar</h4>
          <pre style={{ background: '#fff', padding: 10, borderRadius: 6 }}>{JSON.stringify(results.thermodynamics, null, 2)}</pre>
        </div>
      )}

      {hasEquilibrium ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 15 }}>
            <thead>
              <tr>
                <th>A</th>
                <th>B</th>
                <th>C</th>
                <th>D</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{Number(results.eqA).toFixed(4)}</td>
                <td>{Number(results.eqB).toFixed(4)}</td>
                <td>{Number(results.eqC).toFixed(4)}</td>
                <td>{Number(results.eqD).toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Reaksiyon ilerlemesi (x):</strong> {Number(results.x).toExponential(4)}</p>
          {typeof results.Kcalc !== 'undefined' && <p><strong>Hesaplanan K (Kcalc):</strong> {Number(results.Kcalc).toExponential(4)}</p>}
          {typeof results.maxExtent !== 'undefined' && <p style={{ fontSize: 12, color: '#555' }}>Fiziksel maksimum ilerleme: {Number(results.maxExtent).toFixed(4)}</p>}
          <ConcentrationChart results={results} inputs={inputs} />
        </>
      ) : (
        <div style={{ marginTop: 12, color: '#333' }}>
          <em>Denge konsantrasyonları yalnızca "Denge Konsantrasyonlarını Hesapla" modunda gösterilir.</em>
        </div>
      )}
    </div>
  );
}

function ConcentrationChart({ results, inputs }) {
  // Build sample points from 0..maxExtent
  const maxE = results.maxExtent || Math.max(1, results.x * 2);
  const points = 80;
  const labels = [];
  const Adata = [], Bdata = [], Cdata = [], Ddata = [];
  for (let i = 0; i <= points; i++) {
    const xi = (i / points) * maxE;
    labels.push(xi.toFixed(4));
    const A = Math.max((inputs?.concA ?? 0) - (inputs?.coefA ?? 0) * xi, 0);
    const B = Math.max((inputs?.concB ?? 0) - (inputs?.coefB ?? 0) * xi, 0);
    const C = Math.max((inputs?.concC ?? 0) + (inputs?.coefC ?? 0) * xi, 0);
    const D = Math.max((inputs?.concD ?? 0) + (inputs?.coefD ?? 0) * xi, 0);
    Adata.push(Number(A.toFixed(6)));
    Bdata.push(Number(B.toFixed(6)));
    Cdata.push(Number(C.toFixed(6)));
    Ddata.push(Number(D.toFixed(6)));
  }

  const data = {
    labels,
    datasets: [
      { label: 'A', data: Adata, borderColor: 'rgba(255,99,132,0.9)', fill: false },
      { label: 'B', data: Bdata, borderColor: 'rgba(54,162,235,0.9)', fill: false },
      { label: 'C', data: Cdata, borderColor: 'rgba(75,192,192,0.9)', fill: false },
      { label: 'D', data: Ddata, borderColor: 'rgba(153,102,255,0.9)', fill: false },
    ]
  };

  const options = {
    responsive: true,
    scales: { x: { display: true, title: { display: true, text: 'Extent x' } }, y: { display: true, title: { display: true, text: 'Concentration [mol/L]' } } },
    plugins: {
      legend: { position: 'bottom' },
      verticalLine: { index: Math.round((results.x / (results.maxExtent || results.x || 1)) * labels.length) }
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h4>Konsantrasyonlar vs Reaksiyon İlerlemesi</h4>
      <ChartClient data={data} options={options} />
    </div>
  );
}
