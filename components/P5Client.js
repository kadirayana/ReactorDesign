import { useEffect, useRef } from 'react'

export default function P5Client({ sketch }) {
  const containerRef = useRef(null)
  useEffect(() => {
    let p5Instance = null
    let mounted = true
    let onResize = null
    ;(async () => {
      const p5 = (await import('p5')).default
      if (!mounted || !containerRef.current) return

      // wrapper to attach container size helper
      const wrapper = (p) => {
        p._getContainerSize = () => {
          const el = containerRef.current
          const w = el ? el.clientWidth : 600
          const h = Math.max(200, Math.round(w * 0.5))
          return { w, h }
        }
        // call user sketch
        sketch(p)
      }

      p5Instance = new p5(wrapper, containerRef.current)

      // resize handler
      onResize = () => {
        try {
          if (p5Instance && p5Instance._getContainerSize && p5Instance.resizeCanvas) {
            const { w, h } = p5Instance._getContainerSize()
            p5Instance.resizeCanvas(w, h)
          }
        } catch (e) {
          // ignore
        }
      }

      window.addEventListener('resize', onResize)

      // initial size adjustment
      onResize()
    })()
    return () => {
      mounted = false
      if (p5Instance && p5Instance.remove) p5Instance.remove()
      try { window.removeEventListener('resize', onResize) } catch (e) {}
    }
  }, [sketch])

  return <div ref={containerRef} />
}
