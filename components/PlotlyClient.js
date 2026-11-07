import { useEffect, useRef, useState } from 'react';

function readVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function themedAxis(axis = {}, text, grid) {
  return { gridcolor: grid, zerolinecolor: grid, linecolor: grid, tickfont: { color: text }, ...axis };
}

// Plotly wrapper whose background, fonts and grid follow the site theme.
export default function PlotlyClient({ data, layout, config, height = 420 }) {
  const divRef = useRef(null);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const bump = () => setThemeVersion(v => v + 1);
    window.addEventListener('themechange', bump);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', bump);
    return () => {
      window.removeEventListener('themechange', bump);
      mq.removeEventListener?.('change', bump);
    };
  }, []);

  useEffect(() => {
    let Plotly = null;
    let mounted = true;
    const el = divRef.current;
    (async () => {
      Plotly = (await import('plotly.js-dist')).default;
      if (!mounted || !el) return;
      const text = readVar('--chart-text', '#475569');
      const grid = readVar('--chart-grid', 'rgba(15,23,42,0.08)');
      const base = layout || {};
      const themedLayout = {
        autosize: true,
        height,
        margin: { l: 60, r: 20, t: 40, b: 50 },
        ...base,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { family: 'Inter, system-ui, sans-serif', color: text, ...(base.font || {}) },
        xaxis: themedAxis(base.xaxis, text, grid),
        yaxis: themedAxis(base.yaxis, text, grid),
        ...(base.scene ? {
          scene: {
            ...base.scene,
            xaxis: themedAxis(base.scene.xaxis, text, grid),
            yaxis: themedAxis(base.scene.yaxis, text, grid),
            zaxis: themedAxis(base.scene.zaxis, text, grid),
          },
        } : {}),
      };
      Plotly.newPlot(el, data, themedLayout, { responsive: true, displaylogo: false, ...(config || {}) });
    })();
    return () => {
      mounted = false;
      if (el && Plotly && Plotly.purge) Plotly.purge(el);
    };
  }, [data, layout, config, height, themeVersion]);

  return <div ref={divRef} style={{ width: '100%' }} />;
}
