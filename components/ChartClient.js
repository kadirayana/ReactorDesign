import React, { useEffect, useRef } from 'react';

export default function ChartClient({ data, options, type = 'line', width = '100%', height = 300 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const mod = await import('chart.js/auto');
      if (cancelled) return;
      const Chart = mod && mod.default ? mod.default : mod;
      // register a simple plugin that draws a vertical line given options.plugins.verticalLine.index
      const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        beforeDraw: (chart, args, opts) => {
          const cfg = chart.config && chart.config.options && chart.config.options.plugins && chart.config.options.plugins.verticalLine;
          if (!cfg) return;
          const ctx = chart.ctx;
          const xIndex = cfg.index;
          if (xIndex == null) return;
          const xScale = chart.scales['x'];
          if (!xScale) return;
          // support index or numeric x value
          let xPixel;
          if (typeof xIndex === 'number') {
            // map index to pixel if labels are equidistant
            const meta = chart.getDatasetMeta(0);
            if (meta && meta.data && meta.data[xIndex]) {
              xPixel = meta.data[xIndex].x;
            } else {
              // fallback: use scale.getPixelForValue
              xPixel = xScale.getPixelForValue(chart.data.labels[xIndex]);
            }
          }
          if (!xPixel && xPixel !== 0) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(xPixel, chart.chartArea.top);
          ctx.lineTo(xPixel, chart.chartArea.bottom);
          ctx.lineWidth = cfg.lineWidth || 1;
          ctx.strokeStyle = cfg.color || 'rgba(255,99,132,0.9)';
          ctx.setLineDash(cfg.dash || []);
          ctx.stroke();
          ctx.restore();
        }
      };
      try { Chart.register && Chart.register(verticalLinePlugin); } catch (e) { /* ignore duplicate register */ }
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      chartRef.current = new Chart(ctx, { type, data, options });
    }

    setup();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        try { chartRef.current.destroy(); } catch (e) { /* ignore */ }
      }
    };
  }, [data, options, type, width, height]);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
 