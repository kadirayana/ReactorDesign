import React, { useEffect, useRef, useState } from 'react';

const PALETTE_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5', '--chart-6'];
const FALLBACK = ['#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED', '#0891B2'];

function readVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function withAlpha(color, alpha) {
  // supports #RRGGBB; anything else is returned unchanged
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(base, extra) {
  if (!isPlainObject(extra)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    out[k] = isPlainObject(v) && isPlainObject(base[k]) ? deepMerge(base[k], v) : v;
  }
  return out;
}

// Re-renders when the user switches theme or the OS scheme changes.
function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener('themechange', bump);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', bump);
    return () => {
      window.removeEventListener('themechange', bump);
      mq.removeEventListener?.('change', bump);
    };
  }, []);
  return version;
}

/**
 * Chart.js wrapper.
 * - Dataset colors come from the theme palette (--chart-1…6) unless a dataset sets `keepColor: true`.
 * - Axis/grid/text colors follow the active theme.
 * - `xLabel` / `yLabel` add axis titles.
 */
export default function ChartClient({ data, options, type = 'line', width = '100%', height = 320, xLabel, yLabel, themed = true }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const themeVersion = useThemeVersion();

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const mod = await import('chart.js/auto');
      if (cancelled) return;
      const Chart = mod && mod.default ? mod.default : mod;

      // Vertical marker line: options.plugins.verticalLine = { index, color, lineWidth, dash }
      const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        beforeDraw: chart => {
          const cfg = chart.config?.options?.plugins?.verticalLine;
          if (!cfg || cfg.index == null) return;
          const xScale = chart.scales.x;
          if (!xScale) return;
          const meta = chart.getDatasetMeta(0);
          const xPixel = meta?.data?.[cfg.index]
            ? meta.data[cfg.index].x
            : xScale.getPixelForValue(chart.data.labels?.[cfg.index]);
          if (!Number.isFinite(xPixel)) return;
          const { ctx } = chart;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xPixel, chart.chartArea.top);
          ctx.lineTo(xPixel, chart.chartArea.bottom);
          ctx.lineWidth = cfg.lineWidth || 1;
          ctx.strokeStyle = cfg.color || readVar('--chart-2', '#DC2626');
          ctx.setLineDash(cfg.dash || [4, 4]);
          ctx.stroke();
          ctx.restore();
        },
      };
      try { Chart.register(verticalLinePlugin); } catch (e) { /* already registered */ }
      if (!canvasRef.current) return;

      const text = readVar('--chart-text', '#475569');
      const grid = readVar('--chart-grid', 'rgba(15,23,42,0.08)');
      const palette = PALETTE_VARS.map((v, i) => readVar(v, FALLBACK[i]));
      Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
      Chart.defaults.color = text;

      const isLineLike = type === 'line' || type === 'scatter';
      const datasets = (data?.datasets || []).map((ds, i) => {
        if (!themed || ds.keepColor) return ds;
        const c = palette[i % palette.length];
        const many = (ds.data?.length || 0) > 40;
        return {
          ...ds,
          borderColor: c,
          backgroundColor: isLineLike ? withAlpha(c, 0.12) : withAlpha(c, 0.75),
          pointBackgroundColor: c,
          borderWidth: ds.borderWidth ?? (isLineLike ? 2 : 1),
          pointRadius: ds.pointRadius ?? (isLineLike && many ? 0 : 3),
          pointHoverRadius: ds.pointHoverRadius ?? 4,
          tension: ds.tension ?? 0.15,
        };
      });

      const axis = title => ({
        grid: { color: grid },
        border: { color: grid },
        ticks: { color: text, maxRotation: 0, autoSkipPadding: 12 },
        ...(title ? { title: { display: true, text: title, color: text, font: { weight: 600 } } } : {}),
      });

      const hasXY = !['pie', 'doughnut', 'polarArea', 'radar'].includes(type);
      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: text, usePointStyle: true, boxWidth: 8, padding: 16 } },
          tooltip: { padding: 10, cornerRadius: 8 },
        },
        ...(hasXY ? { scales: { x: axis(xLabel), y: axis(yLabel) } } : {}),
      };

      chartRef.current = new Chart(canvasRef.current.getContext('2d'), {
        type,
        data: { ...data, datasets },
        options: deepMerge(baseOptions, options || {}),
      });
    }

    setup();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        try { chartRef.current.destroy(); } catch (e) { /* ignore */ }
        chartRef.current = null;
      }
    };
  }, [data, options, type, xLabel, yLabel, themed, themeVersion]);

  return (
    <div className="chart-box" style={{ width, height }}>
      <canvas ref={canvasRef} role="img" aria-label={yLabel ? `${yLabel} grafiği` : 'Grafik'} />
    </div>
  );
}
