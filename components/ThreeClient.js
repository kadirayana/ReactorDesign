import { useEffect, useRef } from 'react'

export default function ThreeClient({ onInit }) {
  const mountRef = useRef(null)
  useEffect(() => {
    let mounted = true
    let cleanup = null
    ;(async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')
      if (!mounted || !mountRef.current) return
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
      mountRef.current.appendChild(renderer.domElement)
      const controls = new OrbitControls(camera, renderer.domElement)
      camera.position.set(0, 5, 10)
      controls.update()
      const animate = function () {
        if (!mounted) return
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()
      // keep the canvas sized to its container
      const onResize = () => {
        const el = mountRef.current
        if (!el) return
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(el.clientWidth, el.clientHeight)
      }
      window.addEventListener('resize', onResize)
      const userCleanup = onInit ? onInit({ THREE, scene, camera, renderer }) : null
      cleanup = () => {
        window.removeEventListener('resize', onResize)
        if (typeof userCleanup === 'function') userCleanup()
        controls.dispose()
        renderer.dispose()
      }
    })()
    return () => {
      mounted = false
      if (cleanup && typeof cleanup === 'function') cleanup()
      if (mountRef.current) mountRef.current.innerHTML = ''
    }
  }, [onInit])

  return <div ref={mountRef} className="three-box" />
}
