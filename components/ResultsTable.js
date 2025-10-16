import React from 'react'

export default function ResultsTable({ data }) {
  if (!data || data.length === 0) return null

  const keys = Object.keys(data[0])

  return (
    <div id="dataDisplay" style={{ marginTop: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
        <thead>
          <tr>
            {keys.map(k => (
              <th key={k} style={{ border: '1px solid #ced4da', padding: 8, background: '#00539C', color: '#fff', fontSize: '13px', whiteSpace: 'nowrap' }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {keys.map(k => (
                <td key={k} style={{ border: '1px solid #ced4da', padding: 8, textAlign: 'center', fontSize: '13px' }}>{typeof row[k] === 'number' ? row[k].toFixed(4) : String(row[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
