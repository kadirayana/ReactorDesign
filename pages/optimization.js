import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import TabButton from '../components/TabButton';


const PlotlyClient = dynamic(() => import('../components/PlotlyClient'), { ssr: false });

export default function OptimizationPage() {
  const [tab, setTab] = useState('pareto');
  const [objective, setObjective] = useState('conversion');
  const [constraints, setConstraints] = useState({ temp: false, pressure: false });
  const [reactorType, setReactorType] = useState('CSTR');
  const [ranges, setRanges] = useState({ temp_min: 20, temp_max: 200, volume_min: 1, volume_max: 100 });
  const [flowRate, setFlowRate] = useState(1); // L/s (volume units L, flow L/s -> tau in s)
  const [k0, setK0] = useState(0.01); // pre-exponential factor (1/s)
  const [Ea, setEa] = useState(50); // Activation energy default in kJ/mol
  const [resultsHtml, setResultsHtml] = useState(null);
  const [paretoData, setParetoData] = useState(null);
  const [surfaceData, setSurfaceData] = useState(null);
  const [sensitivityData, setSensitivityData] = useState(null);
  const [sensitivityParams, setSensitivityParams] = useState({ param: 'temperature', min: ranges.temp_min, max: ranges.temp_max, steps: 25 });
  const optimizerRef = useRef(null);

  function handleConstraintChange(e) {
    setConstraints({ ...constraints, [e.target.name]: e.target.checked });
  }

  // Ported (simplified) ReactorOptimizer from legacy version
  function createOptimizer(objectiveArg, typeArg, constraintsArg, rangesArg, flowRateArg = 1, k0Arg = 0.01, EaArg = 50) {
    return new (class ReactorOptimizer {
      constructor(objective, type, constraints, ranges) {
        this.objective = objective;
        this.type = type;
        this.constraints = constraints;
        this.ranges = ranges;
        this.population = [];
        this.generations = 40;
        this.populationSize = 120;
        this.flow = flowRateArg; // volumetric flow (L/s). We interpret volume as L.
        this.k0 = k0Arg; // 1/s
        this.Ea = EaArg * 1000; // convert kJ/mol input to J/mol
      }

      initialize() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) this.population.push(this.generateRandomSolution());
      }

      generateRandomSolution() {
        return {
          temperature: Math.random() * (this.ranges.temp_max - this.ranges.temp_min) + this.ranges.temp_min,
          volume: Math.random() * (this.ranges.volume_max - this.ranges.volume_min) + this.ranges.volume_min
        };
      }

      evaluate(solution) {
        // Units and assumptions:
        // - solution.temperature is in °C
        // - solution.volume is reactor volume in L
        // - this.flow is volumetric flow in L/s
        // - k computed below is taken as 1/s (first-order rate constant)
        // Therefore residence time tau = V (L) / Q (L/s) -> seconds; k * tau is dimensionless.
        const T_K = solution.temperature + 273.15;
        // Arrhenius: k = k0 * exp(-Ea/(R*T)), Ea in J/mol, R = 8.314 J/mol/K
        const R = 8.314;
        const k = (this.k0 || 0.01) * Math.exp(- (this.Ea || 50000) / (R * T_K));
        const Q = this.flow && this.flow > 0 ? this.flow : 1;
        const tau = solution.volume / Q; // seconds
        let conversion = 0;
        if (this.type === 'CSTR') {
          // For a first-order reaction in steady-state CSTR: X = k*tau / (1 + k*tau)
          conversion = (k * tau) / (1 + k * tau);
        } else {
          // PFR (plug flow reactor) for first-order: X = 1 - exp(-k * tau)
          conversion = 1 - Math.exp(-k * tau);
        }
        const selectivity = 0.9 - 0.3 * (solution.temperature / this.ranges.temp_max);
        const cost = 100 * solution.volume + 10 * solution.temperature;
        return { conversion, selectivity, cost };
      }

      getFitness(solution) {
        const r = this.evaluate(solution);
        switch (this.objective) {
          case 'conversion': return r.conversion;
          case 'selectivity': return r.selectivity;
          case 'cost': return -r.cost;
          default: return r.conversion;
        }
      }

      selectParent() {
        const tournament = [];
        for (let i = 0; i < 3; i++) tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
        return tournament.sort((a, b) => this.getFitness(b) - this.getFitness(a))[0];
      }

      crossover(a, b) {
        const r = Math.random();
        return { temperature: r * a.temperature + (1 - r) * b.temperature, volume: r * a.volume + (1 - r) * b.volume };
      }

      mutate(sol) {
        if (Math.random() < 0.1) {
          sol.temperature += (Math.random() - 0.5) * 10;
          sol.volume += (Math.random() - 0.5) * 5;
          sol.temperature = Math.max(this.ranges.temp_min, Math.min(this.ranges.temp_max, sol.temperature));
          sol.volume = Math.max(this.ranges.volume_min, Math.min(this.ranges.volume_max, sol.volume));
        }
      }

      optimize() {
        this.initialize();
        for (let gen = 0; gen < this.generations; gen++) {
          const newPop = [];
          const sorted = [...this.population].sort((a, b) => this.getFitness(b) - this.getFitness(a));
          newPop.push(...sorted.slice(0, 2));
          while (newPop.length < this.populationSize) {
            const p1 = this.selectParent();
            const p2 = this.selectParent();
            const child = this.crossover(p1, p2);
            this.mutate(child);
            newPop.push(child);
          }
          this.population = newPop;
        }
        return this.population.sort((a, b) => this.getFitness(b) - this.getFitness(a))[0];
      }
    })(objectiveArg, typeArg, constraintsArg, rangesArg, flowRateArg);
  }

  function runOptimize() {
    const opt = createOptimizer(objective, reactorType, constraints, ranges, flowRate, k0, Ea);
    optimizerRef.current = opt;
    const solution = opt.optimize();
    const res = opt.evaluate(solution);
    setResultsHtml(
      <div>
        <p>Optimum Sıcaklık: {solution.temperature.toFixed(2)} °C</p>
        <p>Optimum Hacim: {solution.volume.toFixed(2)} L</p>
        <p>Dönüşüm: {(res.conversion * 100).toFixed(2)}%</p>
        <p>Seçicilik: {(res.selectivity * 100).toFixed(2)}%</p>
        <p>Maliyet: ${res.cost.toFixed(2)}</p>
      </div>
    );

    const pareto = opt.population.map(sol => {
      const e = opt.evaluate(sol);
      return { conversion: e.conversion, selectivity: e.selectivity, cost: e.cost };
    });

    setParetoData({ x: pareto.map(d => d.conversion), y: pareto.map(d => d.cost), color: pareto.map(d => d.selectivity) });

    // compute surface
    const tRange = Array.from({ length: 30 }, (_, i) => ranges.temp_min + (ranges.temp_max - ranges.temp_min) * i / 29);
    const vRange = Array.from({ length: 30 }, (_, i) => ranges.volume_min + (ranges.volume_max - ranges.volume_min) * i / 29);
    const z = tRange.map(t => vRange.map(v => opt.evaluate({ temperature: t, volume: v })[objective === 'cost' ? 'cost' : 'conversion']));
    setSurfaceData({ x: tRange, y: vRange, z });
  }

  function runSensitivity() {
    // build an optimizer instance to use its evaluate() method (no GA needed)
    const opt = createOptimizer(objective, reactorType, constraints, ranges, flowRate, k0, Ea);
    // construct sample points
    const { param, min, max, steps } = sensitivityParams;
    const n = Math.max(3, Math.floor(steps));
    const xs = Array.from({ length: n }, (_, i) => min + (max - min) * i / (n - 1));
    const ys = xs.map(x => {
      const sol = { temperature: (param === 'temperature' ? x : (ranges.temp_min + ranges.temp_max) / 2), volume: (param === 'volume' ? x : (ranges.volume_min + ranges.volume_max) / 2) };
      const ev = opt.evaluate(sol);
      // choose objective value
      return objective === 'cost' ? ev.cost : (objective === 'selectivity' ? ev.selectivity : ev.conversion);
    });

    // find max/min marker depending on objective
    let bestIdx = 0;
    if (objective === 'cost') {
      bestIdx = ys.reduce((bi, v, i) => v < ys[bi] ? i : bi, 0);
    } else {
      bestIdx = ys.reduce((bi, v, i) => v > ys[bi] ? i : bi, 0);
    }

    setSensitivityData({ x: xs, y: ys, bestX: xs[bestIdx], bestY: ys[bestIdx] });
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Reaktör Optimizasyonu</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Çok parametreli reaktör optimizasyonu</p>
      <div className="tabs">
        <TabButton active={tab === 'pareto'} onClick={() => setTab('pareto')}>Pareto</TabButton>
        <TabButton active={tab === 'surface'} onClick={() => setTab('surface')}>Yüzey</TabButton>
        <TabButton active={tab === 'sensitivity'} onClick={() => setTab('sensitivity')}>Duyarlılık</TabButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 24 }} className="responsive-opt-grid">
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Reaktör Tipi</label>
            <select value={reactorType} onChange={e => setReactorType(e.target.value)} style={{ width: '100%', marginTop: 4, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
              <option value="CSTR">CSTR</option>
              <option value="PFR">PFR</option>
            </select>
          </div>
          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Optimizasyon Hedefi</label>
            <select value={objective} onChange={e => setObjective(e.target.value)} style={{ width: '100%', marginTop: 4, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
              <option value="conversion">Maksimum Dönüşüm</option>
              <option value="selectivity">Maksimum Seçicilik</option>
              <option value="cost">Minimum Maliyet</option>
            </select>
          </div>
          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Kısıtlamalar</label>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#666' }}>
                <input type="checkbox" name="temp" checked={constraints.temp} onChange={handleConstraintChange} /> Sıcaklık Limiti
              </label>
              <label style={{ display: 'block', fontWeight: 500, color: '#666' }}>
                <input type="checkbox" name="pressure" checked={constraints.pressure} onChange={handleConstraintChange} /> Basınç Limiti
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Sıcaklık Aralığı (°C)</label>
            <div className="param-input-flex" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="number" value={ranges.temp_min} onChange={e => setRanges({ ...ranges, temp_min: Number(e.target.value) })} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
              <input type="number" value={ranges.temp_max} onChange={e => setRanges({ ...ranges, temp_max: Number(e.target.value) })} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            </div>
          </div>

          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Hacim Aralığı (L)</label>
            <div className="param-input-flex" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="number" value={ranges.volume_min} onChange={e => setRanges({ ...ranges, volume_min: Number(e.target.value) })} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
              <input type="number" value={ranges.volume_max} onChange={e => setRanges({ ...ranges, volume_max: Number(e.target.value) })} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            </div>
          </div>

          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Volumetrik Akış (L/s)</label>
            <input type="number" value={flowRate} onChange={e => setFlowRate(Number(e.target.value))} style={{ width: '100%', marginTop: 6, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Not: Residence time τ = V / Q (s). Burada V L, Q L/s kabul edilir.</div>
          </div>

          <div style={{ marginBottom: 12, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <label style={{ fontWeight: 500, color: '#2D3748', display: 'block', marginBottom: 8 }}>Kinetik Parametreler (Arrhenius)</label>
            <div className="param-input-flex" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="number" value={k0} onChange={e => setK0(Number(e.target.value))} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
              <input type="number" value={Ea} onChange={e => setEa(Number(e.target.value))} style={{ flex: 1, minWidth: 0, padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>k = k0 * exp(-Ea/(R T)). k0 (1/s), Ea (kJ/mol).</div>
          </div>

          <button style={{ width: '100%', padding: 12 }} onClick={runOptimize}>Optimize Et</button>

          <div style={{ marginTop: 16, border: '1px solid #e9ecef', borderRadius: 8, padding: 16, background: 'white' }}>
            <h4 style={{ color: '#00539C', fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>Sonuçlar</h4>
            <div>{resultsHtml}</div>
          </div>
        </div>

        <div style={{ flex: 2, minWidth: 320 }}>
          {tab === 'pareto' && (
            <div style={{ height: 420, background: '#f8f9fa', borderRadius: 8, padding: 8 }}>
              {paretoData ? (
                <PlotlyClient
                  data={[{
                    x: paretoData.x,
                    y: paretoData.y,
                    mode: 'markers',
                    type: 'scatter',
                    marker: { color: paretoData.color, colorscale: 'Viridis', showscale: true, colorbar: { title: 'Seçicilik' } }
                  }]}
                  layout={{ title: 'Pareto Grafiği', xaxis: { title: 'Dönüşüm' }, yaxis: { title: 'Maliyet ($)' }, height: 400 }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Pareto grafiği yakında</div>
              )}
            </div>
          )}

          {tab === 'surface' && (
            <div style={{ height: 520, background: '#f8f9fa', borderRadius: 8, padding: 8 }}>
              {surfaceData ? (
                <PlotlyClient
                  data={[{ type: 'surface', x: surfaceData.x, y: surfaceData.y, z: surfaceData.z, colorscale: 'Viridis' }]}
                  layout={{ title: 'Optimizasyon Yüzeyi', scene: { xaxis: { title: 'Sıcaklık (°C)' }, yaxis: { title: 'Hacim (L)' }, zaxis: { title: objective === 'cost' ? 'Maliyet ($)' : 'Dönüşüm' } }, height: 500 }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yüzey grafiği yakında</div>
              )}
            </div>
          )}

          {tab === 'sensitivity' && (
            <div style={{ background: 'white', borderRadius: 8, padding: 12, border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Parametre:
                  <select value={sensitivityParams.param} onChange={e => setSensitivityParams({ ...sensitivityParams, param: e.target.value })} style={{ padding: 6, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="temperature">Sıcaklık</option>
                    <option value="volume">Hacim</option>
                  </select>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Min:
                  <input type="number" value={sensitivityParams.min} onChange={e => setSensitivityParams({ ...sensitivityParams, min: Number(e.target.value) })} style={{ width: 100, padding: 6, border: '1px solid #ddd', borderRadius: 4 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Max:
                  <input type="number" value={sensitivityParams.max} onChange={e => setSensitivityParams({ ...sensitivityParams, max: Number(e.target.value) })} style={{ width: 100, padding: 6, border: '1px solid #ddd', borderRadius: 4 }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Adım Sayısı:
                  <input type="number" min={3} value={sensitivityParams.steps} onChange={e => setSensitivityParams({ ...sensitivityParams, steps: Number(e.target.value) })} style={{ width: 80, padding: 6, border: '1px solid #ddd', borderRadius: 4 }} />
                </label>
                <button onClick={runSensitivity} style={{ marginLeft: 'auto', padding: 8 }}>Çalıştır</button>
              </div>

              <div style={{ height: 320 }}>
                {sensitivityData ? (
                  <PlotlyClient
                    data={[{
                      x: sensitivityData.x,
                      y: sensitivityData.y,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: sensitivityParams.param,
                    }, {
                      x: [sensitivityData.bestX],
                      y: [sensitivityData.bestY],
                      mode: 'markers',
                      marker: { color: 'red', size: 10 },
                      name: 'Optimum'
                    }]}
                    layout={{ title: 'Duyarlılık Analizi', xaxis: { title: sensitivityParams.param === 'temperature' ? 'Sıcaklık (°C)' : 'Hacim (L)' }, yaxis: { title: objective === 'cost' ? 'Maliyet' : (objective === 'selectivity' ? 'Seçicilik' : 'Dönüşüm') }, height: 320 }}
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Duyarlılık analizi için parametreleri ayarlayıp "Çalıştır" butonuna basın.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
