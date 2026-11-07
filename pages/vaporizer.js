import { useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  PageHeader, Section, FormGrid, Field, ButtonRow, Alert, StatGrid, Stat, EmptyState, DataTable, fmt,
} from '../components/ui';
import { computeVaporizer } from '../src/lib/vaporizer';
import { downloadCSV } from '../src/lib/utils';
import { saveHistory } from '../src/lib/history';

const ThreeClient = dynamic(() => import('../components/ThreeClient'), { ssr: false });
const ChartClient = dynamic(() => import('../components/ChartClient'), { ssr: false });

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
  iterations: 5,
};

export default function VaporizerPage() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(i => ({ ...i, [name]: value === '' ? '' : Number(value) }));
  }

  function calculateDesign(e) {
    e?.preventDefault();
    const newErrors = [];
    if (!(inputs.feedFlow > 0)) newErrors.push('Besleme akışı pozitif olmalıdır.');
    if (!(inputs.vaporFraction >= 0 && inputs.vaporFraction <= 1)) newErrors.push('Buhar kesri 0 ile 1 arasında olmalıdır.');
    if (!(inputs.T_water_in > inputs.T_water_out)) newErrors.push('Su giriş sıcaklığı çıkıştan yüksek olmalıdır.');
    if (!(inputs.d0 > inputs.di && inputs.di > 0)) newErrors.push('Tüp dış çapı iç çaptan büyük olmalıdır.');
    if (!(inputs.iterations >= 1)) newErrors.push('İterasyon sayısı en az 1 olmalıdır.');
    setErrors(newErrors);
    if (newErrors.length) { setResults(null); return; }
    try {
      const computed = computeVaporizer(inputs);
      // unique key + inputs so the 3D viewer remounts with the new geometry
      setResults({ ...computed, _key: Date.now(), _inputs: { ...inputs } });
      const last = computed.iterationResults[computed.iterationResults.length - 1];
      saveHistory('Buharlaştırıcı', { Besleme: `${inputs.feedFlow} kmol/h`, 'Buhar kesri': inputs.vaporFraction }, `A = ${fmt(last.A, 1)} m², ${Math.round(last.N_tubes)} tüp`);
    } catch (err) {
      setErrors([err.message]);
      setResults(null);
    }
  }

  function exportCSV() {
    if (!results) return;
    const rows = [
      ['Q_toplam_kW', results.Q_total_kW],
      ['m_su_kg_s', results.m_water],
      ['LMTD_C', results.LMTD],
      ...results.iterationResults.flatMap(r => [
        [`iter${r.iteration}_U_W_m2K`, r.U],
        [`iter${r.iteration}_A_m2`, r.A],
        [`iter${r.iteration}_N_tup`, r.N_tubes],
      ]),
      ['Db_m', results.Db],
      ['Ds_m', results.Ds],
    ];
    downloadCSV('buharlastirici_sonuclar.csv', ['Parametre', 'Deger'], rows);
  }

  const f = (label, name, unit, extra) => <Field key={name} label={label} unit={unit} name={name} value={inputs[name]} onChange={handleChange} {...extra} />;
  const last = results ? results.iterationResults[results.iterationResults.length - 1] : null;

  return (
    <>
      <Head><title>Buharlaştırıcı Tasarımı · Kimya Mühendisliği Hesaplama Platformu</title></Head>
      <div className="page-container">
        <PageHeader
          eyebrow="Isı ve Kütle Transferi"
          title="Buharlaştırıcı Tasarımı"
          lead="Kettle tipi buharlaştırıcı: tüp tarafında ısıtma suyu, gövde tarafında çekirdek kaynama (Mostinski). U iteratif olarak güncellenir; tüp demeti ve gövde çapı hesaplanır."
        />

        <form onSubmit={calculateDesign} noValidate>
          <div className="split split-even">
            <div>
              <Section title="Besleme ve proses" icon="🧪">
                <FormGrid>
                  {f('Besleme akışı', 'feedFlow', 'kmol/h')}
                  {f('Buharlaşan kesir', 'vaporFraction', '0–1', { step: 0.01 })}
                  {f('Besleme giriş sıcaklığı', 'T_feed_in', '°C')}
                  {f('Kaynama (çıkış) sıcaklığı', 'T_feed_out', '°C')}
                  {f('Çalışma basıncı', 'P_operating', 'bar')}
                  {f('Kritik basınç Pc', 'Pc_mix', 'bar')}
                  {f('Buharlaşma ısısı ΔHvap', 'dHvap_mix', 'kJ/kmol')}
                  {f('Sıvı ısı kapasitesi cₚ', 'Cp_mix', 'kJ/(kmol·K)')}
                </FormGrid>
              </Section>
              <Section title="Isıtma suyu (tüp tarafı)" icon="💧">
                <FormGrid>
                  {f('Su giriş sıcaklığı', 'T_water_in', '°C')}
                  {f('Su çıkış sıcaklığı', 'T_water_out', '°C')}
                  {f('Isıl iletkenlik k', 'k_water', 'W/(m·K)')}
                  {f('Isı kapasitesi cₚ', 'Cp_water', 'kJ/(kg·K)')}
                  {f('Yoğunluk ρ', 'rho_water', 'kg/m³')}
                  {f('Viskozite μ', 'mu_water', 'Pa·s')}
                </FormGrid>
              </Section>
            </div>
            <div>
              <Section title="Tüpler ve kirlenme" icon="🧰">
                <FormGrid>
                  {f('Tüp uzunluğu L', 'tubeLength', 'm')}
                  {f('Tüp dış çapı d₀', 'd0', 'm')}
                  {f('Tüp iç çapı dᵢ', 'di', 'm')}
                  {f('Tüp ısıl iletkenliği', 'k_tube', 'W/(m·K)')}
                  {f('Dış kirlenme Rf,o', 'Rf_o', 'm²·K/W')}
                  {f('İç kirlenme Rf,i', 'Rf_i', 'm²·K/W')}
                </FormGrid>
              </Section>
              <Section title="Çözücü" icon="🔁">
                <FormGrid>
                  {f('Başlangıç U tahmini', 'U_initial', 'W/(m²·K)')}
                  {f('Maks. iterasyon', 'iterations', '–', { step: 1, min: 1, max: 20 })}
                  {f('Serbest bölge yüksekliği', 'freeboard', 'm')}
                </FormGrid>
                <ButtonRow>
                  <button type="submit">Tasarımı hesapla</button>
                  <button type="button" className="btn-secondary" onClick={() => { setInputs(defaultInputs); setResults(null); setErrors([]); }}>Sıfırla</button>
                </ButtonRow>
              </Section>
            </div>
          </div>
        </form>

        {errors.length > 0 && (
          <Alert type="error" title="Hesaplanamadı:">
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{errors.map((er, idx) => <li key={idx}>{er}</li>)}</ul>
          </Alert>
        )}

        {!results ? (
          <EmptyState icon="🌫️" title="Tasarım sonuçları burada görünecek">Isı yükü, iterasyon geçmişi, tüp sayısı ve 3B demet görünümü.</EmptyState>
        ) : (
          <>
            <Section
              title="Tasarım özeti"
              icon="📊"
              actions={<button type="button" className="btn-secondary btn-sm" onClick={exportCSV}>CSV indir</button>}
            >
              <StatGrid>
                <Stat primary label="Isı yükü" value={results.Q_total_kW} unit="kW" digits={1} />
                <Stat primary label="Isı transfer alanı" value={last.A} unit="m²" digits={2} />
                <Stat label="Tüp sayısı" value={Math.ceil(last.N_tubes)} digits={0} />
                <Stat label="Hesaplanan U" value={last.U_calc} unit="W/(m²·K)" digits={0} />
                <Stat label="Su debisi" value={results.m_water} unit="kg/s" digits={2} />
                <Stat label="LMTD" value={results.LMTD} unit="°C" digits={2} />
                <Stat label="Demet çapı Db" value={results.Db} unit="m" digits={3} />
                <Stat label="Gövde çapı Ds" value={results.Ds} unit="m" digits={3} />
              </StatGrid>
              {!results.converged && <Alert type="warning">U yakınsamadı (son iterasyonda %{fmt(results.relativeUChange * 100, 1)} değişim). İterasyon sayısını artırın.</Alert>}
              {results.reWarning && <Alert type="warning">{results.reWarning}</Alert>}
              {results.packWarning && <Alert type="warning">{results.packWarning}</Alert>}
            </Section>

            <Section title="U iterasyonları" icon="🔁">
              <ChartClient
                data={{
                  labels: results.iterationResults.map(r => r.iteration),
                  datasets: [
                    { label: 'Varsayılan U', data: results.iterationResults.map(r => r.U) },
                    { label: 'Hesaplanan U', data: results.iterationResults.map(r => r.U_calc) },
                  ],
                }}
                xLabel="İterasyon"
                yLabel="U [W/(m²·K)]"
                height={260}
              />
              <DataTable
                columns={[
                  { key: 'iteration', label: '#', digits: 0 },
                  { key: 'U', label: 'U [W/m²K]', digits: 0 },
                  { key: 'A', label: 'A [m²]', digits: 2 },
                  { key: 'N_tubes', label: 'Tüp', digits: 0 },
                  { key: 'v_water', label: 'v [m/s]', digits: 2 },
                  { key: 'Re', label: 'Re', digits: 0 },
                  { key: 'h_i', label: 'hᵢ [W/m²K]', digits: 0 },
                  { key: 'h_nb', label: 'h_nb [W/m²K]', digits: 0 },
                  { key: 'U_calc', label: 'U hesap', digits: 0 },
                ]}
                rows={results.iterationResults}
              />
            </Section>

            <Section title="3B tüp demeti" icon="🧊" description="Sürükleyerek döndürün">
          <ThreeClient key={results._key} onInit={({ THREE, scene, camera, renderer }) => {
            // set white background for the renderer
            if (renderer && renderer.setClearColor) {
              const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-subtle').trim() || '#F8FAFC';
              renderer.setClearColor(new THREE.Color(bg), 1);
            }
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
            labelWrap.style.color = 'var(--text-main)';
            labelWrap.style.fontFamily = 'var(--font-body)';
            labelWrap.style.background = 'color-mix(in srgb, var(--bg-surface) 85%, transparent)';
            labelWrap.style.padding = '8px 10px';
            labelWrap.style.borderRadius = '8px';
            labelWrap.style.lineHeight = '1.5';
            labelWrap.style.fontSize = '13px';
            labelWrap.style.pointerEvents = 'none';
            const fitNote = results.packWarning ? `<div style="color:var(--error)"><strong>UYARI:</strong> ${results.packWarning}</div>` : '';
            labelWrap.innerHTML = `<div><strong>İç çap:</strong> ${(tubeDia * 1000).toFixed(1)} mm</div><div><strong>Tüp sayısı (talep/yerleşen):</strong> ${Math.max(1, Math.round(last.N_tubes || N))}/${results.packedCount}</div><div><strong>Shell Ø:</strong> ${(Ds * 1000).toFixed(0)} mm</div><div><strong>Freeboard:</strong> ${(freeboardHeight * 1000).toFixed(0)} mm</div>${fitNote}<div style="margin-top:6px"><em>Gri plakalar:</em> tüp aynaları • Mavi: tüp tarafı • Turuncu: gövde tarafı</div>`;
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
            </Section>
          </>
        )}
      </div>
    </>
  );
}
