import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { PageHeader, Section, EmptyState, Alert } from '../components/ui';
import { loadHistory, clearHistory } from '../src/lib/history';
import { downloadCSV } from '../src/lib/utils';

// Older records (before v2) stored raw fields; turn them into the common shape.
function normalize(item) {
  if (item.v === 2) return item;
  const params = {};
  ['C0', 'kDyn', 'simTime', 'F_A0', 'C_A0', 'k', 'X', 'A0', 'K'].forEach(k => { if (item[k] !== undefined) params[k] = item[k]; });
  return {
    module: item.tip || 'Bilinmeyen',
    params,
    summary: item.sonuc !== undefined ? String(item.sonuc) : '—',
    tarih: item.tarih,
  };
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadHistory().map(normalize).reverse());
    setLoaded(true);
  }, []);

  const modules = useMemo(() => Array.from(new Set(items.map(i => i.module))).sort(), [items]);
  const visible = filter ? items.filter(i => i.module === filter) : items;

  function onClear() {
    if (typeof window !== 'undefined' && !window.confirm('Tüm hesaplama geçmişi bu tarayıcıdan silinecek. Emin misiniz?')) return;
    clearHistory();
    setItems([]);
  }

  function onExport() {
    downloadCSV(
      'hesaplama_gecmisi.csv',
      ['Tarih', 'Modul', 'Parametreler', 'Sonuc'],
      visible.map(i => [i.tarih, `"${i.module}"`, `"${Object.entries(i.params || {}).map(([k, v]) => `${k}=${v}`).join('; ')}"`, `"${i.summary}"`]),
    );
  }

  return (
    <>
      <Head><title>Hesaplama Geçmişi · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Diğer"
          title="Hesaplama Geçmişi"
          lead="Yaptığınız hesaplamalar yalnızca bu tarayıcıda saklanır; hiçbir sunucuya gönderilmez. En fazla 200 kayıt tutulur."
        />
        <Section
          title={`${visible.length} kayıt`}
          icon="🕘"
          actions={items.length > 0 && (
            <>
              <select aria-label="Modüle göre filtrele" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', minHeight: 32, padding: '4px 32px 4px 10px', fontSize: 13 }}>
                <option value="">Tüm modüller</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button type="button" className="btn-secondary btn-sm" onClick={onExport}>CSV indir</button>
              <button type="button" className="btn-ghost btn-sm" onClick={onClear}>Temizle</button>
            </>
          )}
        >
          {loaded && items.length === 0 && (
            <EmptyState icon="🗂️" title="Henüz kayıt yok">Herhangi bir modülde hesap yaptığınızda burada listelenir.</EmptyState>
          )}
          {visible.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Modül</th>
                    <th>Parametreler</th>
                    <th>Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item, i) => (
                    <tr key={`${item.tarih}-${i}`}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(item.tarih)}</td>
                      <td><span className="badge">{item.module}</span></td>
                      <td className="small">
                        {Object.entries(item.params || {}).map(([k, v]) => (
                          <span key={k} style={{ marginRight: 12, whiteSpace: 'nowrap' }}><span className="muted">{k}:</span> {String(v)}</span>
                        ))}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>{item.summary}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        {items.length > 0 && <Alert type="info">Tarayıcı verilerini temizlemek veya gizli pencere kullanmak geçmişi siler.</Alert>}
      </div>
    </>
  );
}
