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
  }, [data, options, type]);

  return (
    <div style={{ width, height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
