import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { computeConvection } from '../src/lib/convection';
const ChartClient = dynamic(() => import('./ChartClient'), { ssr: false });

export default function ConvectionCalculator() {
  const [mode, setMode] = useState('forced-flat');
  const [geometry, setGeometry] = useState({ L: 1.0, V: 2.0, D: 0.05 });
  const [temps, setTemps] = useState({ T_surface: 80, T_fluid: 20 });
  const [A, setA] = useState(1.0);
  const [result, setResult] = useState(null);

  function handleGeomChange(e) {
    const { name, value } = e.target;
    setGeometry(prev => ({ ...prev, [name]: Number(value) }));
  }

  function handleTemps(e) {
    const { name, value } = e.target;
    setTemps(prev => ({ ...prev, [name]: Number(value) }));
  }

  function calculate() {
    const conv = computeConvection({ type: mode, geometry, fluid: null });
    const h = conv.h || 10;
    const Q = h * A * (temps.T_surface - temps.T_fluid);
    setResult({ ...conv, h, Q });
  }

  const chartData = result
    ? {
        labels: ['Fluid', 'Surface'],
        datasets: [{ label: 'Temperature (°C)', data: [temps.T_fluid, temps.T_surface], borderColor: 'orange', fill: false }],
      }
    : null;

  return (
    <div style={{ maxWidth: 640 }}>
      <h3>Convection Calculator</h3>
      <label>Mode:
        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="forced-flat">Forced (flat plate)</option>
          <option value="forced-tube">Forced (tube)</option>
          <option value="natural-vertical">Natural (vertical plate)</option>
        </select>
      </label>

      {mode === 'forced-flat' && (
        <>
          <label>Characteristic length L (m)
            <input type="number" name="L" value={geometry.L} step="0.01" onChange={handleGeomChange} />
          </label>
          <label>Velocity V (m/s)
            <input type="number" name="V" value={geometry.V} step="0.1" onChange={handleGeomChange} />
          </label>
        </>
      )}

      {mode === 'forced-tube' && (
        <>
          <label>Diameter D (m)
            <input type="number" name="D" value={geometry.D} step="0.001" onChange={handleGeomChange} />
          </label>
          <label>Velocity V (m/s)
            <input type="number" name="V" value={geometry.V} step="0.1" onChange={handleGeomChange} />
          </label>
        </>
      )}

      {mode === 'natural-vertical' && (
        <>
          <label>Plate height L (m)
            <input type="number" name="L" value={geometry.L} step="0.01" onChange={handleGeomChange} />
          </label>
        </>
      )}

      <label>Area A (m²)
        <input type="number" value={A} step="0.1" onChange={e => setA(Number(e.target.value))} />
      </label>

      <label>Surface temperature (°C)
        <input type="number" name="T_surface" value={temps.T_surface} onChange={handleTemps} />
      </label>
      <label>Fluid temperature (°C)
        <input type="number" name="T_fluid" value={temps.T_fluid} onChange={handleTemps} />
      </label>

      <button onClick={calculate} style={{ marginTop: 8 }}>Calculate</button>

      {result && (
        <div style={{ marginTop: 12 }}>
          <div><strong>h: </strong>{result.h ? result.h.toFixed(3) + ' W/m²K' : '—'}</div>
          <div><strong>Q: </strong>{result.Q.toFixed(2)} W</div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ Nu: result.Nu, Re: result.Re || result.ReL, Pr: result.Pr, Ra: result.Ra }, null, 2)}</pre>
          </div>
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
