// Calculation history kept in the browser (localStorage key "hesaplamalar").
const KEY = 'hesaplamalar';
const MAX_ENTRIES = 200;

/**
 * Save a calculation.
 * @param {string} module  Module title shown in the history table
 * @param {object} params  Key inputs, e.g. { 'Fₐ₀': '10 mol/s' }
 * @param {string} summary Main result as display text, e.g. 'V = 3,22 m³'
 */
export function saveHistory(module, params, summary) {
  if (typeof window === 'undefined') return;
  try {
    const list = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    list.push({ v: 2, module, params, summary, tarih: new Date().toISOString() });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch (e) {
    // storage full or unavailable: history is a convenience, never block a calculation
  }
}

export function loadHistory() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function clearHistory() {
  try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
