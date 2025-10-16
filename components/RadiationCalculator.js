import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { blackbody, graybody, twoSurfaceExchange } from '../src/lib/radiation';
const ChartClient = dynamic(() => import('./ChartClient'), { ssr: false });

export default function RadiationCalculator() {
  const [mode, setMode] = useState('graybody');
  const [inputs, setInputs] = useState({ emissivity: 0.9, area: 1, T_surface: 80, T_surroundings: 20 });
  const [surfaces, setSurfaces] = useState({ T1: 800, A1: 1, e1: 0.8, T2: 300, A2: 2, e2: 0.6, F12: 0.8 });
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: Number(value) }));
  }

  function handleSurfaces(e) {
    const { name, value } = e.target;
    setSurfaces(prev => ({ ...prev, [name]: Number(value) }));
  }

  function calculate() {
    if (mode === 'blackbody') {
      const T = inputs.T_surface > 1000 ? inputs.T_surface : inputs.T_surface + 273.15;
      const res = blackbody({ T, A: inputs.area });
      setResult({ Q: res.Q });
    } else if (mode === 'graybody') {
      const T = inputs.T_surface > 1000 ? inputs.T_surface : inputs.T_surface + 273.15;
      const T0 = inputs.T_surroundings > 1000 ? inputs.T_surroundings : inputs.T_surroundings + 273.15;
      const res = graybody({ T, A: inputs.area, epsilon: inputs.emissivity, T_surroundings: T0 });
      setResult({ Q: res.Q });
    } else if (mode === 'surfaces') {
      // inputs surfaces in K expected; allow °C inputs
      const T1 = surfaces.T1 > 1000 ? surfaces.T1 : surfaces.T1 + 273.15;
      const T2 = surfaces.T2 > 1000 ? surfaces.T2 : surfaces.T2 + 273.15;
      const res = twoSurfaceExchange({ T1, A1: surfaces.A1, eps1: surfaces.e1, T2, A2: surfaces.A2, eps2: surfaces.e2, F12: surfaces.F12 });
      setResult({ Q: res.Q });
    }
  }

  const chartData = result
    ? {
        labels: mode === 'surfaces' ? ['Surface 2', 'Surface 1'] : ['Surroundings', 'Surface'],
        datasets: [{ label: 'Temperature (°C)', data: mode === 'surfaces' ? [surfaces.T2, surfaces.T1] : [inputs.T_surroundings, inputs.T_surface], borderColor: 'purple', fill: false }],
      }
    : null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h3>Radiation Calculator</h3>
      <label>Mode:
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="blackbody">Blackbody</option>
          <option value="graybody">Graybody</option>
          <option value="surfaces">Two Surfaces</option>
        </select>
      </label>

      {mode === 'blackbody' && (
        <>
          <label>Temperature (K)
            <input type="number" name="T_surface" value={inputs.T_surface} onChange={handleChange} />
          </label>
          <label>Area (m²)
            <input type="number" name="area" value={inputs.area} onChange={handleChange} />
          </label>
        </>
      )}

      {mode === 'graybody' && (
        <>
          <label>Temperature (°C)
            <input type="number" name="T_surface" value={inputs.T_surface} onChange={handleChange} />
          </label>
          <label>Surroundings (°C)
            <input type="number" name="T_surroundings" value={inputs.T_surroundings} onChange={handleChange} />
          </label>
          <label>Emissivity
            <input type="number" name="emissivity" value={inputs.emissivity} step="0.01" min="0" max="1" onChange={handleChange} />
          </label>
          <label>Area (m²)
            <input type="number" name="area" value={inputs.area} onChange={handleChange} />
          </label>
        </>
      )}

      {mode === 'surfaces' && (
        <>
          <label>Surface 1 Temp (°C or K if over 1000)
            <input type="number" name="T1" value={surfaces.T1} onChange={handleSurfaces} />
          </label>
          <label>Surface 1 Area (m²)
            <input type="number" name="A1" value={surfaces.A1} onChange={handleSurfaces} />
          </label>
          <label>Surface 1 Emissivity
            <input type="number" name="e1" value={surfaces.e1} step="0.01" onChange={handleSurfaces} />
          </label>
          <label>Surface 2 Temp (°C or K if over 1000)
            <input type="number" name="T2" value={surfaces.T2} onChange={handleSurfaces} />
          </label>
          <label>Surface 2 Area (m²)
            <input type="number" name="A2" value={surfaces.A2} onChange={handleSurfaces} />
          </label>
          <label>Surface 2 Emissivity
            <input type="number" name="e2" value={surfaces.e2} step="0.01" onChange={handleSurfaces} />
          </label>
          <label>View Factor F12
            <input type="number" name="F12" value={surfaces.F12} step="0.01" min="0" max="1" onChange={handleSurfaces} />
          </label>
        </>
      )}

      <button onClick={calculate} style={{ marginTop: 8 }}>Calculate</button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <strong>Q (radiation): {result.Q ? result.Q.toExponential(3) : '—'} W</strong>
        </div>
      )}

      {chartData && (
        <div style={{ marginTop: 12 }}>
          <ChartClient data={chartData} options={{ responsive: true }} type="bar" />
        </div>
      )}
    </div>
  );
}
