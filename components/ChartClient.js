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

// Axis/tooltip numbers: ≤ `sig` significant digits, Turkish decimal comma, scientific for extremes
function formatTick(v, sig = 3) {
  if (!Number.isFinite(v)) return '';
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1e5 || a < 1e-3) return v.toExponential(Math.max(0, sig - 2)).replace('.', ',');
  return Number(v.toPrecision(sig)).toLocaleString('tr-TR', { maximumFractionDigits: 6 });
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

      // Numeric category labels (0, 0.0322, 0.0644, …) become a real linear x axis,
      // so ticks are round numbers instead of every raw sample value.
      const labels = data?.labels;
      const numericX = type === 'line' && Array.isArray(labels) && labels.length > 1
        && labels.every(l => l !== '' && l !== null && Number.isFinite(Number(l)));

      const isLineLike = type === 'line' || type === 'scatter';
      const srcSets = data?.datasets || [];
      const single = srcSets.length === 1;
      const datasets = srcSets.map((ds, i) => {
        let points = ds.data;
        if (numericX && Array.isArray(points) && points.length && typeof points[0] !== 'object') {
          points = points.map((y, k) => ({ x: Number(labels[k]), y }));
        }
        if (!themed || ds.keepColor) return { ...ds, data: points };
        const c = palette[i % palette.length];
        const many = (points?.length || 0) > 25;
        const lineOnly = isLineLike && (ds.showLine !== false) && (type === 'line' || ds.showLine);
        return {
          ...ds,
          data: points,
          borderColor: c,
          backgroundColor: isLineLike ? withAlpha(c, single && type === 'line' ? 0.08 : 0.15) : withAlpha(c, 0.8),
          fill: ds.fill ?? (single && type === 'line' ? 'origin' : false),
          pointBackgroundColor: c,
          pointBorderColor: c,
          borderWidth: ds.borderWidth ?? (isLineLike ? 2.25 : 0),
          borderRadius: type === 'bar' ? 6 : undefined,
          pointRadius: ds.pointRadius ?? (lineOnly && many ? 0 : 3.5),
          pointHoverRadius: ds.pointHoverRadius ?? 5,
          tension: ds.tension ?? 0.2,
        };
      });

      const axis = (title, isX) => ({
        grid: { color: grid, drawTicks: false },
        border: { display: false },
        ticks: {
          color: text,
          padding: 8,
          maxRotation: 0,
          autoSkipPadding: 16,
          maxTicksLimit: isX ? 8 : 6,
          font: { size: 11.5 },
          callback(value) {
            // category axes pass an index; show the label text for those
            const v = this.type === 'category' ? this.getLabelForValue(value) : value;
            return typeof v === 'number' ? formatTick(v) : v;
          },
        },
        ...(title ? { title: { display: true, text: title, color: text, font: { size: 12, weight: 600 }, padding: { top: 8, bottom: 4 } } } : {}),
      });

      const hasXY = !['pie', 'doughnut', 'polarArea', 'radar'].includes(type);
      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        layout: { padding: { top: 4, right: 8 } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: !single,
            position: 'top',
            align: 'end',
            labels: { color: text, boxWidth: 14, boxHeight: 3, padding: 14, font: { size: 12 } },
          },
          tooltip: {
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              title: items => (items.length && numericX ? `${xLabel ? `${xLabel.split(' [')[0]}: ` : ''}${formatTick(items[0].parsed.x, 4)}` : undefined),
              label: c => `${c.dataset.label ? `${c.dataset.label}: ` : ''}${formatTick(c.parsed.y, 4)}`,
            },
          },
        },
        ...(hasXY ? {
          scales: {
            x: { ...axis(xLabel, true), ...(numericX ? { type: 'linear', min: Number(labels[0]), max: Number(labels[labels.length - 1]), ticks: { ...axis(xLabel, true).ticks, includeBounds: false } } : {}) },
            y: axis(yLabel, false),
          },
        } : {}),
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
