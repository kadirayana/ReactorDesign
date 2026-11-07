// three.js scene for the kettle vaporizer: transparent shell, tube bundle (instanced),
// tube sheet, channel head, liquid level and nozzles. The camera frames the model automatically.

function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function buildVaporizerScene({ THREE, scene, camera, controls, container }, results) {
  const inputs = results._inputs || {};
  const L = Number(inputs.tubeLength) || 3;
  const d0 = Number(inputs.d0) || 0.0254;
  const Ds = results.Ds || 0.6;
  const Db = results.Db || Ds / 2;
  const R = Ds / 2;
  const positions = results.packedPositions || [];

  const disposables = [];
  const track = obj => { disposables.push(obj); return obj; };
  const group = new THREE.Group();
  scene.add(group);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8892a6, 1.1);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-4, 2, -3);
  scene.add(hemi, key, fill);

  const primary = new THREE.Color(cssColor('--primary', '#2563EB'));
  const warm = new THREE.Color(cssColor('--chart-4', '#D97706'));

  // Tube bundle sits in the lower part of the kettle shell
  const bundleCenterY = -(R - Db / 2) * 0.75;
  const tubeGeom = track(new THREE.CylinderGeometry(d0 / 2, d0 / 2, L, 14));
  tubeGeom.rotateZ(Math.PI / 2); // axis along X
  const tubeMat = track(new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.55, roughness: 0.35 }));
  const tubes = new THREE.InstancedMesh(tubeGeom, tubeMat, Math.max(1, positions.length));
  const m = new THREE.Matrix4();
  positions.forEach(([py, pz], i) => {
    m.makeTranslation(0, bundleCenterY + py, pz);
    tubes.setMatrixAt(i, m);
  });
  tubes.count = positions.length;
  group.add(tubes);

  // Shell (transparent) with solid end rings
  const shellGeom = track(new THREE.CylinderGeometry(R, R, L * 1.08, 64, 1, true));
  shellGeom.rotateZ(Math.PI / 2);
  const shellMat = track(new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  }));
  group.add(new THREE.Mesh(shellGeom, shellMat));
  const ringGeom = track(new THREE.TorusGeometry(R, Math.max(0.006, R * 0.025), 12, 64));
  const ringMat = track(new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.4, roughness: 0.4 }));
  [-0.54 * L, 0.54 * L].forEach(x => {
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
    group.add(ring);
  });
  const capGeom = track(new THREE.CircleGeometry(R, 64));
  const capMat = track(new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.rotation.y = Math.PI / 2;
  cap.position.x = 0.54 * L;
  group.add(cap);

  // Tube sheet + channel head (tube-side water box) on the left
  const sheetGeom = track(new THREE.CylinderGeometry(Db * 0.58, Db * 0.58, Math.max(0.02, L * 0.012), 48));
  sheetGeom.rotateZ(Math.PI / 2);
  const sheetMat = track(new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 }));
  const sheet = new THREE.Mesh(sheetGeom, sheetMat);
  sheet.position.set(-L / 2, bundleCenterY, 0);
  group.add(sheet);
  const headLen = Math.max(0.12, Db * 0.45);
  const headGeom = track(new THREE.CylinderGeometry(Db * 0.58, Db * 0.58, headLen, 48));
  headGeom.rotateZ(Math.PI / 2);
  const headMat = track(new THREE.MeshStandardMaterial({ color: primary, metalness: 0.2, roughness: 0.5, transparent: true, opacity: 0.85 }));
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(-L / 2 - headLen / 2, bundleCenterY, 0);
  group.add(head);

  // Boiling liquid surface: a chord across the shell just above the bundle
  const levelY = Math.min(R * 0.85, bundleCenterY + Db / 2 + Math.max(0.03, Db * 0.08));
  const chord = 2 * Math.sqrt(Math.max(0, R * R - levelY * levelY));
  const levelGeom = track(new THREE.PlaneGeometry(L * 1.06, chord));
  const levelMat = track(new THREE.MeshStandardMaterial({ color: primary, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  const level = new THREE.Mesh(levelGeom, levelMat);
  level.rotation.x = -Math.PI / 2;
  level.position.y = levelY;
  group.add(level);

  // Nozzles: water in/out on the channel head (blue), feed in bottom and vapour out top (orange)
  const nozzleR = Math.max(0.025, Ds * 0.06);
  const nozzleGeom = track(new THREE.CylinderGeometry(nozzleR, nozzleR, Ds * 0.35, 24));
  const blueMat = track(new THREE.MeshStandardMaterial({ color: primary, metalness: 0.3, roughness: 0.4 }));
  const warmMat = track(new THREE.MeshStandardMaterial({ color: warm, metalness: 0.3, roughness: 0.4 }));
  const nozzle = (mat, x, y, z) => {
    const n = new THREE.Mesh(nozzleGeom, mat);
    n.position.set(x, y, z);
    group.add(n);
  };
  nozzle(blueMat, -L / 2 - headLen / 2, bundleCenterY + Db * 0.58 + Ds * 0.15, 0);
  nozzle(blueMat, -L / 2 - headLen / 2, bundleCenterY - Db * 0.58 - Ds * 0.15, 0);
  nozzle(warmMat, L * 0.25, R + Ds * 0.15, 0);
  nozzle(warmMat, -L * 0.25, -R - Ds * 0.15, 0);

  // Frame the model: fit the bounding box (seen from a 3/4 view) into both field-of-view directions
  const box = new THREE.Box3().setFromObject(group);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const vfov = (camera.fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const distW = (size.x * 0.92) / 2 / Math.tan(hfov / 2);
  const distH = (Math.max(size.y, size.z) * 1.05) / 2 / Math.tan(vfov / 2);
  const dist = Math.max(distW, distH) * 1.5 + size.z / 2;
  const dir = new THREE.Vector3(0.32, 0.38, 1).normalize();
  const sphere = { center };
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.near = dist / 100;
  camera.far = dist * 20;
  camera.updateProjectionMatrix();
  controls.target.copy(sphere.center);
  controls.minDistance = dist * 0.3;
  controls.maxDistance = dist * 3;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  const stopRotate = () => { controls.autoRotate = false; };
  controls.addEventListener('start', stopRotate);
  controls.update();

  // Legend overlay
  const legend = document.createElement('div');
  legend.className = 'three-legend';
  const fits = results.packedCount >= Math.ceil(results.iterationResults.at(-1).N_tubes);
  legend.innerHTML = `
    <div><strong>${results.packedCount}</strong> tüp · d₀ ${(d0 * 1000).toFixed(1)} mm · L ${L.toFixed(2)} m</div>
    <div>Gövde Ø ${(Ds * 1000).toFixed(0)} mm · Demet Ø ${(Db * 1000).toFixed(0)} mm</div>
    ${fits ? '' : '<div class="three-legend-warn">Gerekli tüplerin tamamı gövdeye sığmıyor</div>'}
    <div class="three-legend-keys">
      <span><i style="background:#b87333"></i>Tüpler</span>
      <span><i style="background:${primary.getStyle()}"></i>Su (tüp tarafı)</span>
      <span><i style="background:${warm.getStyle()}"></i>Besleme / buhar</span>
    </div>`;
  container.appendChild(legend);

  return () => {
    controls.removeEventListener('start', stopRotate);
    scene.remove(group, hemi, key, fill);
    tubes.dispose();
    disposables.forEach(d => d.dispose && d.dispose());
    legend.remove();
  };
}
