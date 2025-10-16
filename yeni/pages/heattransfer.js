import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import calculateHeatTransfer from '../src/lib/heattransfer';

// Temporary: use the clean chart client implementation until the corrupted file is fixed
const ChartClient = dynamic(() => import('../components/ChartClientClean'), { ssr: false });

export default function HeatTransferPage() {
  const [inputs, setInputs] = useState({ U: 500, A: 10, Th_in: 150, Th_out: 100, Tc_in: 30, Tc_out: 80 });

  const result = useMemo(() => calculateHeatTransfer({ ...inputs, points: 80 }), [inputs]);

  const data = {
    labels: result.profiles.x.map(x => (x * 100).toFixed(0) + '%'),
    datasets: [
      {
        label: 'Hot fluid T (°C)',
        data: result.profiles.Th,
        borderColor: 'rgba(220,20,60,0.9)',
        backgroundColor: 'rgba(220,20,60,0.2)',
        tension: 0.2,
        fill: false
      },
      {
        label: 'Cold fluid T (°C)',
        data: result.profiles.Tc,
        borderColor: 'rgba(30,144,255,0.9)',
        backgroundColor: 'rgba(30,144,255,0.2)',
        tension: 0.2,
        fill: false
      },
      {
        label: 'ΔT (°C)',
        data: result.profiles.dT,
        borderColor: 'rgba(34,139,34,0.9)',
        backgroundColor: 'rgba(34,139,34,0.15)',
        tension: 0.2,
        fill: false
      }
    ]
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Heat Transfer (LMTD) — migrated</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ minWidth: 320 }}>
          <label>Overall heat transfer coeff U (W/m²K)
            <input type="number" value={inputs.U} onChange={e => setInputs({ ...inputs, U: Number(e.target.value) })} />
          </label>
          <br />
          <label>Area A (m²)
            <input type="number" value={inputs.A} onChange={e => setInputs({ ...inputs, A: Number(e.target.value) })} />
          </label>
          <br />
          <label>Th inlet (°C)
            <input type="number" value={inputs.Th_in} onChange={e => setInputs({ ...inputs, Th_in: Number(e.target.value) })} />
          </label>
          <br />
          <label>Th outlet (°C)
            <input type="number" value={inputs.Th_out} onChange={e => setInputs({ ...inputs, Th_out: Number(e.target.value) })} />
          </label>
          <br />
          <label>Tc inlet (°C)
            <input type="number" value={inputs.Tc_in} onChange={e => setInputs({ ...inputs, Tc_in: Number(e.target.value) })} />
          </label>
          <br />
          <label>Tc outlet (°C)
            <input type="number" value={inputs.Tc_out} onChange={e => setInputs({ ...inputs, Tc_out: Number(e.target.value) })} />
          </label>
          <br />
          <div style={{ marginTop: 10 }}>
            <strong>Q (W):</strong> {result.Q.toFixed(2)} <br />
            <strong>LMTD:</strong> {result.LMTD.toFixed(2)} °C
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <ChartClient data={data} options={{ responsive: true, maintainAspectRatio: false }} type="line" />
        </div>
      </div>
    </div>
  );
}
