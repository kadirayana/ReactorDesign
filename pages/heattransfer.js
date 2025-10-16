
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import calculateHeatTransfer from '../src/lib/heattransfer';

const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });
import ConvectionCalculator from '../components/ConvectionCalculator';
import RadiationCalculator from '../components/RadiationCalculator';

function TabButton({ active, onClick, children }) {
  return (
    <button
      style={{
        background: active ? '#00539C' : 'transparent',
        color: active ? 'white' : '#666',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        padding: '12px 20px',
        borderRadius: '0',
        marginRight: 0,
        fontWeight: active ? '600' : '500',
        transition: '0.3s',
        borderBottom: active ? '3px solid #00539C' : '3px solid transparent',
        minHeight: 'auto',
        transform: 'none',
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ConductionCalculator() {
  const [geometry, setGeometry] = useState('wall');
  const [inputs, setInputs] = useState({
    wallThickness: 0.1,
    wallThermalConductivity: 0.6,
    wallArea: 1.0,
    firstSurfaceTemp: 100,
    secondSurfaceTemp: 25,
    // cylinder
    innerRadius: 0.05,
    outerRadius: 0.1,
    cylinderLength: 1.0,
    cylinderThermalConductivity: 15,
    // sphere
    sphereInnerRadius: 0.05,
    sphereOuterRadius: 0.1,
    sphereThermalConductivity: 15,
  });
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(inputs => ({ ...inputs, [name]: parseFloat(value) }));
  }

  function calculate() {
    const T1 = inputs.firstSurfaceTemp;
    const T2 = inputs.secondSurfaceTemp;
    let Q = 0;
    if (geometry === 'wall') {
      const { wallThickness: L, wallThermalConductivity: k, wallArea: A } = inputs;
      Q = k * A * (T1 - T2) / L;
    } else if (geometry === 'cylinder') {
      const { innerRadius: r1, outerRadius: r2, cylinderLength: L, cylinderThermalConductivity: k } = inputs;
      Q = (2 * Math.PI * k * L * (T1 - T2)) / Math.log(r2 / r1);
    } else if (geometry === 'sphere') {
      const { sphereInnerRadius: r1, sphereOuterRadius: r2, sphereThermalConductivity: k } = inputs;
      Q = (4 * Math.PI * k * (T1 - T2)) / ((1 / r1) - (1 / r2));
    }
    setResult({ Q, T1, T2 });
  }

  // Chart data for temperature profile
  const chartData = result
    ? {
        labels: ['Başlangıç', 'Bitiş'],
        datasets: [
          {
            label: 'Sıcaklık (°C)',
            data: [result.T1, result.T2],
            borderColor: 'red',
            fill: false,
          },
        ],
      }
    : null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h3 style={{ margin: '0 0 8px 0', fontFamily: "'Poppins', sans-serif", fontSize: 18, fontWeight: 600 }}>Isı İletimi Hesaplaması</h3>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Geometri Tipi:</span>
        <select value={geometry} onChange={e => setGeometry(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14, cursor: 'pointer' }}>
          <option value="wall">Düz Duvar</option>
          <option value="cylinder">Silindirik</option>
          <option value="sphere">Küresel</option>
        </select>
      </label>
      {geometry === 'wall' && (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Duvar Kalınlığı L [m]:</span>
            <input type="number" name="wallThickness" value={inputs.wallThickness} step="0.001" min="0.001" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Termal İletkenlik k [W/(m·K)]:</span>
            <input type="number" name="wallThermalConductivity" value={inputs.wallThermalConductivity} step="0.1" min="0.1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Alan A [m²]:</span>
            <input type="number" name="wallArea" value={inputs.wallArea} step="0.1" min="0.1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
        </>
      )}
      {geometry === 'cylinder' && (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>İç Yarıçap r₁ [m]:</span>
            <input type="number" name="innerRadius" value={inputs.innerRadius} step="0.001" min="0.001" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Dış Yarıçap r₂ [m]:</span>
            <input type="number" name="outerRadius" value={inputs.outerRadius} step="0.001" min="0.001" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Silindir Uzunluğu L [m]:</span>
            <input type="number" name="cylinderLength" value={inputs.cylinderLength} step="0.1" min="0.1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Termal İletkenlik k [W/(m·K)]:</span>
            <input type="number" name="cylinderThermalConductivity" value={inputs.cylinderThermalConductivity} step="0.1" min="0.1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
        </>
      )}
      {geometry === 'sphere' && (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>İç Yarıçap r₁ [m]:</span>
            <input type="number" name="sphereInnerRadius" value={inputs.sphereInnerRadius} step="0.001" min="0.001" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Dış Yarıçap r₂ [m]:</span>
            <input type="number" name="sphereOuterRadius" value={inputs.sphereOuterRadius} step="0.001" min="0.001" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Termal İletkenlik k [W/(m·K)]:</span>
            <input type="number" name="sphereThermalConductivity" value={inputs.sphereThermalConductivity} step="0.1" min="0.1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
          </label>
        </>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>Birinci Yüzey Sıcaklığı T₁ [°C]:</span>
        <input type="number" name="firstSurfaceTemp" value={inputs.firstSurfaceTemp} step="1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>İkinci Yüzey Sıcaklığı T₂ [°C]:</span>
        <input type="number" name="secondSurfaceTemp" value={inputs.secondSurfaceTemp} step="1" onChange={handleChange} style={{ padding: '8px 12px', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 14 }} />
      </label>
      <button onClick={calculate} style={{ marginTop: 10, padding: '10px 20px', background: '#00539C', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 14, minHeight: 40, transition: '0.2s', transform: 'translateY(0px)' }} onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.target.style.transform = 'translateY(0px)'}>Hesapla ve Görselleştir</button>
      {result && (
        <div style={{ marginTop: 16, background: '#e9ecef', padding: 10, borderRadius: 4 }}>
          <strong>İletim yoluyla ısı transferi: {result.Q.toFixed(2)} W</strong>
        </div>
      )}
      {chartData && (
        <div style={{ marginTop: 16 }}>
          <ChartClient data={chartData} options={{ responsive: true, maintainAspectRatio: false }} type="line" />
        </div>
      )}
    </div>
  );
}

export default function HeatTransferPage() {
  const [tab, setTab] = useState('conduction');

  return (
    <div className="page-container">
      <h1 className="page-title">Isı Transferi Hesaplaması</h1>
      <div className="tabs">
        <TabButton active={tab === 'conduction'} onClick={() => setTab('conduction')}>İletim</TabButton>
        <TabButton active={tab === 'convection'} onClick={() => setTab('convection')}>Taşınım</TabButton>
        <TabButton active={tab === 'radiation'} onClick={() => setTab('radiation')}>Işınım</TabButton>
        <TabButton active={tab === 'exchanger'} onClick={() => setTab('exchanger')}>Isı Değiştiricisi</TabButton>
      </div>
      <div style={{ background: 'white', padding: 20, borderRadius: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 400 }}>
        {tab === 'conduction' && <ConductionCalculator />}
        {tab === 'exchanger' && (
          <div>
            <h3>Heat Transfer (LMTD)</h3>
            <LMTDCalculator />
          </div>
        )}

  {tab === 'convection' && <ConvectionCalculator />}
  {tab === 'radiation' && <RadiationCalculator />}
      </div>
    </div>
  );
}

function LMTDCalculator() {
  const [inputs, setInputs] = useState({ U: 500, A: 10, Th_in: 150, Th_out: 100, Tc_in: 30, Tc_out: 80 });
  const result = calculateHeatTransfer({ ...inputs, points: 80 });
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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1.5fr', gap: 20, '@media (max-width: 768px)': { gridTemplateColumns: '1fr', gap: 16 } }}>
      <div style={{ minWidth: 280 }}>
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
  );
}
