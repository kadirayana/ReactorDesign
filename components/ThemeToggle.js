import { useEffect, useState } from 'react';

// Cycles light -> dark -> system. "system" removes the attribute so CSS follows the OS.
const ORDER = ['system', 'light', 'dark'];
const LABEL = { system: 'Sistem teması', light: 'Açık tema', dark: 'Koyu tema' };
const ICON = { system: '🖥️', light: '☀️', dark: '🌙' };

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  window.dispatchEvent(new Event('themechange'));
}

export default function ThemeToggle({ className, showLabel = true }) {
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    } catch (e) { /* storage unavailable */ }
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    try {
      if (next === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch (e) { /* storage unavailable */ }
    applyTheme(next);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={cycle}
      aria-label={`Tema: ${LABEL[theme]}. Değiştirmek için tıklayın.`}
      title={LABEL[theme]}
    >
      <span aria-hidden>{ICON[theme]}</span>
      {showLabel && <span>{LABEL[theme]}</span>}
    </button>
  );
}
