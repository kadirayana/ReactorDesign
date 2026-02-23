import { useState } from 'react';
import { computeVaporizer } from '../src/lib/vaporizer';
import dynamic from 'next/dynamic';

const ThreeClient = dynamic(() => import('../components/ThreeClient'), { ssr: false });

const defaultInputs = {
  feedFlow: 503.32,
  vaporFraction: 0.3,
  T_feed_in: -45.3,
  T_feed_out: -37.9,
  P_operating: 1.6,
  Pc_mix: 53.57,
  dHvap_mix: 18017,
  Cp_mix: 101.2,
  T_water_in: 50,
  T_water_out: 35,
  k_water: 0.598,
  Cp_water: 4.18,
  rho_water: 1000,
  mu_water: 0.0001,
  tubeLength: 3,
  d0: 0.0254,
  di: 0.0218,
  Rf_o: 0.0005,
  Rf_i: 0.0003,
  k_tube: 14,
  U_initial: 740,
  freeboard: 0.08,
  iterations: 2
};

export default function VaporizerPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value, type } = e.target;
    // parse number inputs; allow clearing
    const parsed = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    setInputs(i => ({ ...i, [name]: parsed }));
  }

  function calculateDesign() {
    // basic validation
    const newErrors = [];
    if (inputs.feedFlow <= 0) newErrors.push('Feed akışı pozitif olmalıdır.');
    if (inputs.T_water_in <= inputs.T_water_out) newErrors.push('Su giriş sıcaklığı, çıkıştan yüksek olmalıdır.');
    if (inputs.T_water_out <= inputs.T_feed_in) newErrors.push('Termodinamik Hata: Su çıkış sıcaklığı, feed giriş sıcaklığından yüksek olmalıdır (Sıcaklık Kesişimi).');
    if (inputs.iterations < 1) newErrors.push('İterasyon sayısı en az 1 olmalıdır.');
    setErrors(newErrors);
    if (newErrors.length) return;
    const {
      feedFlow, vaporFraction, T_feed_in, T_feed_out, P_operating,
      Pc_mix, dHvap_mix, Cp_mix, T_water_in, T_water_out, k_water, Cp_water, rho_water, mu_water,
      tubeLength, d0, di, Rf_o, Rf_i, k_tube, U_initial, freeboard, iterations
    } = inputs;
    const computed = computeVaporizer(inputs);
    // attach a unique key and the inputs used so the 3D viewer can remount/update
    setResults({ ...computed, _key: Date.now(), _inputs: { ...inputs } });
  }

  function resetDefaults() {
    setInputs(defaultInputs);
    setResults(null);
    setErrors([]);
  }

  function exportCSV() {
    if (!results) return;
    const rows = [];
    rows.push(["Parameter", "Value"]);
    rows.push(["Q_total_kJ_h", results.Q_total_kJ_h]);
    rows.push(["Q_total_kW", results.Q_total_kW]);
    rows.push(["m_water_kg_per_s", results.m_water]);
    rows.push(["LMTD_C", results.LMTD]);
    results.iterationResults.forEach(r => {
      rows.push([`iteration_${r.iteration}_U_W_m2K`, r.U]);
      rows.push([`iteration_${r.iteration}_A_m2`, r.A]);
      rows.push([`iteration_${r.iteration}_N_tubes`, r.N_tubes]);
    });
    rows.push(["Db_m", results.Db]);
    rows.push(["Ds_m", results.Ds]);
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaporizer_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Vaporizer Tasarım Hesaplayıcı</h1>
      <form onSubmit={e => { e.preventDefault(); calculateDesign(); }}>
        {errors.length > 0 && (
          <div style={{ background: '#fff1f0', color: '#611a15', border: '1px solid #f5c6cb', padding: 10, marginBottom: 12, borderRadius: 6 }}>
            <strong>Hatalar:</strong>
            <ul>
              {errors.map((er, idx) => <li key={idx}>{er}</li>)}
            </ul>
          </div>
        )}
        <Section title="Feed & Süreç Verileri">
          <InputRow label="Feed Akış (kmol/h):" name="feedFlow" value={inputs.feedFlow} onChange={handleChange} />
          <InputRow label="Vapor fraksiyonu:" name="vaporFraction" value={inputs.vaporFraction} step="0.01" onChange={handleChange} />
          <InputRow label="Feed Giriş Sıcaklığı (°C):" name="T_feed_in" value={inputs.T_feed_in} onChange={handleChange} />
          <InputRow label="Feed Çıkış Sıcaklığı (°C):" name="T_feed_out" value={inputs.T_feed_out} onChange={handleChange} />
          <InputRow label="Çalışma Basıncı (atm):" name="P_operating" value={inputs.P_operating} step="0.1" onChange={handleChange} />
        </Section>
        <Section title="Liquid-Vapor Karışım Özellikleri">
          <InputRow label="Pc (atm):" name="Pc_mix" value={inputs.Pc_mix} step="0.01" onChange={handleChange} />
          <InputRow label="ΔHvap (kJ/kmol):" name="dHvap_mix" value={inputs.dHvap_mix} onChange={handleChange} />
          <InputRow label="Cp (kJ/kmolK):" name="Cp_mix" value={inputs.Cp_mix} onChange={handleChange} />
        </Section>
        <Section title="Soğutma Suyu Özellikleri">
          <InputRow label="Su Giriş Sıcaklığı (°C):" name="T_water_in" value={inputs.T_water_in} onChange={handleChange} />
          <InputRow label="Su Çıkış Sıcaklığı (°C):" name="T_water_out" value={inputs.T_water_out} onChange={handleChange} />
          <InputRow label="Isı İletkenliği, k (W/mK):" name="k_water" value={inputs.k_water} step="0.001" onChange={handleChange} />
          <InputRow label="Cp (kJ/kgK):" name="Cp_water" value={inputs.Cp_water} step="0.01" onChange={handleChange} />
          <InputRow label="Yoğunluk (kg/m³):" name="rho_water" value={inputs.rho_water} onChange={handleChange} />
          <InputRow label="Viskozite (kg/m·s):" name="mu_water" value={inputs.mu_water} step="0.00001" onChange={handleChange} />
        </Section>
        <Section title="Tüp & Fouling Verileri">
          <InputRow label="Tüp Uzunluğu, L (m):" name="tubeLength" value={inputs.tubeLength} step="0.1" onChange={handleChange} />
          <InputRow label="Dış Tüp Çapı, d₀ (m):" name="d0" value={inputs.d0} step="0.0001" onChange={handleChange} />
          <InputRow label="İç Tüp Çapı, dᵢ (m):" name="di" value={inputs.di} step="0.0001" onChange={handleChange} />
          <InputRow label="Fouling Faktörü, Rf,o (m²K/W):" name="Rf_o" value={inputs.Rf_o} step="0.0001" onChange={handleChange} />
          <InputRow label="Fouling Faktörü, Rf,i (m²K/W):" name="Rf_i" value={inputs.Rf_i} step="0.0001" onChange={handleChange} />
          <InputRow label="Tüp Malzeme Isı İletkenliği (W/mK):" name="k_tube" value={inputs.k_tube} step="0.1" onChange={handleChange} />
          <InputRow label="Varsayılan Başlangıç U (W/m²K):" name="U_initial" value={inputs.U_initial} onChange={handleChange} />
          <InputRow label="Freeboard (m):" name="freeboard" value={inputs.freeboard} step="0.01" onChange={handleChange} />
          <InputRow label="İterasyon Sayısı:" name="iterations" value={inputs.iterations} min="1" max="10" step="1" onChange={handleChange} />
        </Section>
        <button type="submit" style={{ width: 200, margin: '20px auto', display: 'block' }}>Tasarımı Hesapla</button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button type="button" onClick={exportCSV} style={{ padding: '8px 12px' }} disabled={!results}>CSV İndir</button>
          <button type="button" onClick={resetDefaults} style={{ padding: '8px 12px' }}>Sıfırla</button>
        </div>
      </form>
      {results && <VaporizerResults results={results} />}
      {results && (
        <div style={{ marginTop: 24 }}>
          <h3>3D Görselleştirme</h3>
          <ThreeClient key={results._key} onInit={({ THREE, scene, camera, renderer }) => {
            // set white background for the renderer
            if (renderer && renderer.setClearColor) renderer.setClearColor(0xffffff, 1);
            // nicer visualization: hexagonal packing, metal material, tube end caps, transparent shell, soft lighting, and slow auto-rotate
            const inputs = results._inputs || {};
            const last = results.iterationResults[results.iterationResults.length - 1] || {};
            const N = Math.max(1, Math.round(last.N_tubes || 1));
            const tubeDia = inputs.di || 0.0218;
            const tubeLength = inputs.tubeLength || 1;
            const tubeRadius = Math.max(0.002, tubeDia / 2);
            const scale = Math.max(0.02, tubeDia);

            // hexagonal packing generator (returns positions for N tubes)
            function hexPositions(N, pitch) {
              const positions = [];
              let ring = 0;
              positions.push([0, 0]);
              while (positions.length < N) {
                ring++;
                for (let q = -ring; q <= ring; q++) {
                  for (let r = Math.max(-ring, -q - ring); r <= Math.min(ring, -q + ring); r++) {
                    const s = -q - r;
                    // axial to cartesian (pointy-top hex) approximate
                    const x = pitch * (q + r / 2);
                    const y = pitch * (Math.sqrt(3) / 2 * r);
                    if (positions.length < N) positions.push([x, y]);
                  }
                }
              }
              return positions.slice(0, N);
            }

            const pitch = tubeRadius * 2.4; // spacing factor
            // prefer positions computed by calculation module (ensures fit in shell)
            const positions = (results.packedPositions && results.packedPositions.length) ? results.packedPositions : hexPositions(N, pitch);

            const group = new THREE.Group();

            // material: metallic with slight roughness
            const metalMat = new THREE.MeshStandardMaterial({ color: 0x2f6f9f, metalness: 0.8, roughness: 0.25 });
            const capMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6, roughness: 0.3 });

            const tubeGeoms = [];
            const capGeoms = [];
            for (let i = 0; i < positions.length; i++) {
              const [x, y] = positions[i];
              const geom = new THREE.CylinderGeometry(tubeRadius * 0.98, tubeRadius * 0.98, tubeLength * 1.02, 28);
              const mesh = new THREE.Mesh(geom, metalMat);
              mesh.rotation.z = Math.PI / 2;
              mesh.position.set(x, y, 0);
              // add end caps as thin cylinders
              const cap = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius * 0.98, tubeRadius * 0.98, 0.02 * tubeLength, 28), capMat);
              cap.rotation.y = Math.PI / 2;
              cap.position.set(x + tubeLength / 2, y, 0);
              const cap2 = cap.clone();
              cap2.position.set(x - tubeLength / 2, y, 0);
              group.add(mesh);
              group.add(cap);
              group.add(cap2);
              tubeGeoms.push(geom);
              capGeoms.push(cap.geometry);
            }

            // transparent shell
            const Ds = results.Ds || Math.max(0.05, (Math.sqrt(N) * pitch * 2));
            const shellRadius = Ds / 2;
            const shellGeom = new THREE.CylinderGeometry(shellRadius, shellRadius, Math.max(0.8, tubeLength * 1.1), 64);
            const shellMat = new THREE.MeshPhysicalMaterial({ color: 0x99aabb, transparent: true, opacity: 0.25, roughness: 0.3, metalness: 0.1, side: THREE.DoubleSide });
            const shell = new THREE.Mesh(shellGeom, shellMat);
            shell.rotation.z = Math.PI / 2;
            group.add(shell);

            // small platform to ground the model
            const platform = new THREE.Mesh(new THREE.BoxGeometry(Ds * 1.6, Math.max(0.02, tubeLength * 0.2), 0.02), new THREE.MeshStandardMaterial({ color: 0xf0f2f5 }));
            platform.rotation.z = Math.PI / 2;
            platform.position.z = -Math.max(0.02, tubeLength * 0.55);
            group.add(platform);

            scene.add(group);

            // lighting: HDR-like via directional + ambient + hemi
            const dir = new THREE.DirectionalLight(0xffffff, 1.0);
            dir.position.set(5, 10, 8);
            scene.add(dir);
            const hemi = new THREE.HemisphereLight(0xffffee, 0x444455, 0.6);
            scene.add(hemi);
            const amb = new THREE.AmbientLight(0xffffff, 0.25);
            scene.add(amb);

            // static presentation (no auto-rotation) — engineers typically inspect from fixed orientations
            let running = false;

            // camera framing: slightly elevated iso view
            const maxDim = Math.max(shellRadius * 2.2, Math.sqrt(N) * pitch * 1.2, tubeLength * 1.2);
            camera.position.set(maxDim * 0.9, maxDim * 0.6, maxDim * 1.2);
            camera.lookAt(0, 0, 0);

            // add tube sheets (plates) at both ends
            const sheetThickness = Math.max(0.01, tubeLength * 0.02);
            const sheetWidth = Math.max(Ds * 1.1, shellRadius * 2.2);
            const sheetGeom = new THREE.BoxGeometry(sheetWidth, sheetWidth, sheetThickness);
            const sheetMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 0.4, roughness: 0.5 });
            const sheet1 = new THREE.Mesh(sheetGeom, sheetMat);
            const sheet2 = sheet1.clone();
            sheet1.position.set(tubeLength / 2 + sheetThickness / 2, 0, 0);
            sheet2.position.set(-tubeLength / 2 - sheetThickness / 2, 0, 0);
            group.add(sheet1);
            group.add(sheet2);

            // add nozzles (tube side inlet/outlet) as short pipes on the tube-sheet
            const nozzleGeom = new THREE.CylinderGeometry(sheetThickness * 0.6, sheetThickness * 0.6, sheetThickness * 1.8, 20);
            const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1f77b4 });
            const nozzleIn = new THREE.Mesh(nozzleGeom, nozzleMat);
            nozzleIn.rotation.y = Math.PI / 2;
            nozzleIn.position.set(-tubeLength / 2 - sheetThickness, -sheetWidth * 0.18, 0);
            const nozzleOut = nozzleIn.clone();
            nozzleOut.position.set(tubeLength / 2 + sheetThickness, sheetWidth * 0.18, 0);
            group.add(nozzleIn); group.add(nozzleOut);

            // shell nozzles (shell-side inlet/outlet) as larger orange pipes
            const shellNozzleGeom = new THREE.CylinderGeometry(sheetThickness * 0.9, sheetThickness * 0.9, sheetThickness * 2.2, 20);
            const shellNozzleMat = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
            const shellInNozzle = new THREE.Mesh(shellNozzleGeom, shellNozzleMat);
            shellInNozzle.rotation.z = Math.PI / 2;
            shellInNozzle.position.set(-shellRadius - 0.12, 0, 0);
            const shellOutNozzle = shellInNozzle.clone();
            shellOutNozzle.position.set(shellRadius + 0.12, 0, 0);
            group.add(shellInNozzle); group.add(shellOutNozzle);

            // freeboard / vapor space indicator: transparent plane above tubes
            const freeboardHeight = Math.max(0.05, tubeLength * 0.12);
            const fbGeom = new THREE.PlaneGeometry(sheetWidth, sheetWidth);
            const fbMat = new THREE.MeshBasicMaterial({ color: 0x99ccff, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
            const fbPlane = new THREE.Mesh(fbGeom, fbMat);
            fbPlane.rotation.y = Math.PI / 2;
            fbPlane.position.set(0, 0, freeboardHeight);
            group.add(fbPlane);

            // labels using simple DOM overlay (less distortion than sprites)
            const container = renderer.domElement.parentElement;
            const labelWrap = document.createElement('div');
            labelWrap.style.position = 'absolute';
            labelWrap.style.top = '8px';
            labelWrap.style.left = '8px';
            labelWrap.style.color = '#0b4f6c';
            labelWrap.style.fontFamily = 'Arial, sans-serif';
            labelWrap.style.fontSize = '13px';
            labelWrap.style.pointerEvents = 'none';
            const fitNote = results.packWarning ? `<div style="color:#b22222"><strong>UYARI:</strong> ${results.packWarning}</div>` : '';
            labelWrap.innerHTML = `<div><strong>İç çap:</strong> ${(tubeDia * 1000).toFixed(1)} mm</div><div><strong>Tüp sayısı (talep/yerleşen):</strong> ${Math.max(1, Math.round(last.N_tubes || N))}/${results.packedCount}</div><div><strong>Shell Ø:</strong> ${(Ds * 1000).toFixed(0)} mm</div><div><strong>Freeboard:</strong> ${(freeboardHeight * 1000).toFixed(0)} mm</div>${fitNote}<div style="margin-top:6px"><em>Grey plates:</em> tube sheets • Blue pipes: tube-side • Orange pipes: shell-side</div>`;
            container.style.position = 'relative';
            container.appendChild(labelWrap);

            // add flow arrows to indicate shell/tube inlets and outlets
            function makeArrow(from, to, color = 0xff4444) {
              const dirVec = new THREE.Vector3().subVectors(to, from).normalize();
              const len = from.distanceTo(to);
              const arrow = new THREE.ArrowHelper(dirVec, from, len, color, 0.08 * len, 0.04 * len);
              return arrow;
            }
            // tube-side flow (arrows along tube length on the first and last rows)
            if (positions && positions.length) {
              const firstPos = positions[0];
              const lastPos = positions[Math.min(positions.length - 1, Math.floor(positions.length / 2))];
              const from = new THREE.Vector3(firstPos[0] - tubeLength / 2, firstPos[1], 0);
              const to = new THREE.Vector3(firstPos[0] + tubeLength / 2, firstPos[1], 0);
              const arrow1 = makeArrow(from, to, 0x1f77b4);
              const arrow2 = makeArrow(new THREE.Vector3(lastPos[0] + tubeLength / 2, lastPos[1], 0), new THREE.Vector3(lastPos[0] - tubeLength / 2, lastPos[1], 0), 0x1f77b4);
              scene.add(arrow1); scene.add(arrow2);
            }

            // shell-side flow arrow (in the +X direction)
            const shellIn = new THREE.Vector3(-shellRadius - 0.1, 0, 0);
            const shellOut = new THREE.Vector3(shellRadius + 0.1, 0, 0);
            const shellArrow = makeArrow(shellIn, shellOut, 0xff8c00);
            scene.add(shellArrow);

            // cleanup function
            return () => {
              running = false;
              scene.remove(group);
              scene.remove(dir);
              scene.remove(hemi);
              scene.remove(amb);
              // remove arrows and nozzles if present
              try { scene.remove(shellArrow); } catch (e) { }
              try { if (typeof arrow1 !== 'undefined') scene.remove(arrow1); if (typeof arrow2 !== 'undefined') scene.remove(arrow2); } catch (e) { }
              try { scene.remove(nozzleIn); scene.remove(nozzleOut); } catch (e) { }
              try { scene.remove(shellInNozzle); scene.remove(shellOutNozzle); } catch (e) { }
              if (labelWrap && labelWrap.parentElement) labelWrap.parentElement.removeChild(labelWrap);
              // dispose geometries and materials
              tubeGeoms.forEach(g => g.dispose());
              capGeoms.forEach(g => g.dispose());
              if (shellGeom) shellGeom.dispose();
              if (shellMat) shellMat.dispose();
              if (platform.geometry) platform.geometry.dispose();
              if (sheetGeom) sheetGeom.dispose();
              if (sheetMat) sheetMat.dispose();
              if (nozzleGeom) nozzleGeom.dispose();
              if (shellNozzleGeom) shellNozzleGeom.dispose();
              if (fbGeom) fbGeom.dispose();
            };
          }} />
          <p style={{ marginTop: 8 }}><a href="/legacy/vaporizer.html" target="_blank" rel="noreferrer">Ayrıntılı Legacy 3D Görselleştirme</a></p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card">
      <h2 style={{ fontSize: 20, color: '#00539C', borderBottom: '2px solid #00539C', paddingBottom: 8, marginBottom: 12, fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}

function InputRow({ label, name, value, onChange, ...rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <label htmlFor={name} style={{ flex: '1 0 300px', fontWeight: 500, color: '#2D3748' }}>{label}</label>
      <input
        type="number"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={{ flex: '1 0 150px', padding: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}
        {...rest}
      />
    </div>
  );
}

function VaporizerResults({ results }) {
  return (
    <div style={{ background: '#f1fdf4', border: '1px solid #c3e9cb', borderLeft: '4px solid #51CF66', padding: 20, borderRadius: 8, marginTop: 20 }}>
      <h2 style={{ fontSize: 20, color: '#00539C', fontFamily: "'Poppins', sans-serif", fontWeight: 600, marginBottom: 16 }}>Tasarım Sonuçları</h2>
      <p style={{ marginBottom: 12 }}><strong>Isı Yükü:</strong> {results.Q_total_kJ_h.toFixed(0)} kJ/h ({results.Q_total_kW.toFixed(2)} kW)</p>
      <p style={{ marginBottom: 12 }}><strong>Su Kütle Akışı:</strong> {results.m_water.toFixed(3)} kg/s ({(results.m_water * 3600).toFixed(2)} kg/h)</p>
      <p style={{ marginBottom: 16 }}><strong>LMTD:</strong> {results.LMTD.toFixed(2)} °C</p>
      {results.iterationResults.map(result => (
        <div key={result.iteration} className="card" style={{ padding: 12, marginTop: 12, marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, color: '#00539C', fontWeight: 600, marginBottom: 8 }}>İterasyon {result.iteration} (U = {result.U.toFixed(0)} W/m²K)</h3>
          <p style={{ marginBottom: 6 }}><strong>Isı Transfer Alanı:</strong> {result.A.toFixed(2)} m²</p>
          <p style={{ marginBottom: 6 }}><strong>Tüp Sayısı:</strong> {result.N_tubes.toFixed(0)}</p>
          <p style={{ marginBottom: 6 }}><strong>Su Hızı:</strong> {result.v_water.toFixed(2)} m/s</p>
          <p style={{ marginBottom: 6 }}><strong>Reynolds Sayısı:</strong> {result.Re.toFixed(0)}</p>
          <p style={{ marginBottom: 6 }}><strong>Su Tarafı h (hᵢ):</strong> {result.h_i.toFixed(0)} W/m²K</p>
          <p style={{ marginBottom: 6 }}><strong>Kabuk Tarafı h (hₙb):</strong> {result.h_nb.toFixed(0)} W/m²K</p>
          <p><strong>Hesaplanan U:</strong> {result.U_calc.toFixed(0)} W/m²K</p>
        </div>
      ))}
      <h3 style={{ fontSize: 16, color: '#00539C', fontWeight: 600, marginTop: 16, marginBottom: 8 }}>Tasarım Kontrolleri</h3>
      <p style={{ marginBottom: 6 }}><strong>Bundle Çapı (Db):</strong> {results.Db.toFixed(3)} m</p>
      <p style={{ marginBottom: 6 }}><strong>Shell Çapı (Ds):</strong> {results.Ds.toFixed(3)} m</p>
      <p><strong>Freeboard Oranı (h/Ds):</strong> {results.freeboard_ratio.toFixed(3)}</p>
    </div>
  );
}
