/**
 * Utility: download data as a CSV file.
 * @param {string} filename – the file name for the download
 * @param {string[]} headers – column headers
 * @param {Array<Array<string|number>>} rows – data rows
 */
export function downloadCSV(filename, headers, rows) {
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
