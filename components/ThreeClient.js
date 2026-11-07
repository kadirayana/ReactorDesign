import { useEffect, useRef } from 'react';

/**
 * Minimal three.js host: creates renderer, camera and orbit controls, then calls
 * `onInit({ THREE, scene, camera, renderer, controls, container })`, which may return a cleanup.
 * Pass a memoised `onInit` (useCallback) – a new function re-creates the whole scene.
 */
export default function ThreeClient({ onInit, height }) {
  const mountRef = useRef(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = null;
    const el = mountRef.current;

    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls');
      if (disposed || !el) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, el.clientWidth / el.clientHeight, 0.01, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      let frame = 0;
      const animate = () => {
        if (disposed) return;
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      const onResize = () => {
        if (!el.clientWidth || !el.clientHeight) return;
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      };
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
      ro?.observe(el);
      window.addEventListener('resize', onResize);

      const userCleanup = onInit ? onInit({ THREE, scene, camera, renderer, controls, container: el }) : null;
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        ro?.disconnect();
        window.removeEventListener('resize', onResize);
        if (typeof userCleanup === 'function') userCleanup();
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement);
      };
    })();

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [onInit]);

  return <div ref={mountRef} className="three-box" style={height ? { height } : undefined} />;
}
