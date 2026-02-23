import { useEffect, useState } from 'react';

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString();
}

function getParams(item) {
  if (item.tip === 'PFR' || item.tip === 'CSTR' || item.tip === 'Batch' || item.tip === 'PBR') {
    let params = `F_A0: ${item.F_A0}, C_A0: ${item.C_A0}, k: ${item.k}, X: ${item.X}`;
    if (item.tip === 'PBR') params += `, k_eff: ${item.k_eff}`;
    return params;
  } else if (item.tip === 'Kimyasal Denge') {
    return `A0: ${item.A0}, K: ${item.K}`;
  } else if (item.tip === 'Isı Transferi') {
    return `L: ${item.L}, k: ${item.kVal}, T₁: ${item.T1}, T₂: ${item.T2}`;
  } else if (item.tip === 'Dinamik Simülasyon') {
    return `C0: ${item.C0}, k: ${item.kDyn}, Süre: ${item.simTime}`;
  } else if (item.tip === 'Vaporizer Tasarım') {
    return `feedFlow: ${item.feedFlow}, vaporFraction: ${item.vaporFraction}, T_in: ${item.T_in}, T_out: ${item.T_out}, P: ${item.P}`;
  }
  return '';
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hesaplamalar = JSON.parse(localStorage.getItem('hesaplamalar')) || [];
      setHistory(hesaplamalar.reverse());
    }
  }, []);

  return (
    <div className="page-container">
      <div className="content-card">
        <h1 className="page-title" style={{ textAlign: 'center' }}>Hesaplama Geçmişi</h1>
        <table className="table-modern">
          <thead>
            <tr>
              <th style={thStyle}>Tarih</th>
              <th style={thStyle}>Modül</th>
              <th style={thStyle}>Parametreler</th>
              <th style={thStyle}>Sonuç</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Henüz kayıt bulunmamaktadır.</td></tr>
            ) : (
              history.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                  <td style={tdStyle}>{formatDate(item.tarih)}</td>
                  <td style={tdStyle}>{item.tip}</td>
                  <td style={tdStyle}>{getParams(item)}</td>
                  <td style={tdStyle}>{item.sonuc !== undefined ? Number(item.sonuc).toFixed(3) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {};
const tdStyle = {};
