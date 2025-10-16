import { useEffect, useRef } from 'react'

export default function PlotlyClient({ data, layout, config }) {
  const divRef = useRef(null)
  useEffect(() => {
    let Plotly = null
    let mounted = true
    ;(async () => {
      Plotly = (await import('plotly.js-dist')).default
      if (!mounted || !divRef.current) return
      Plotly.newPlot(divRef.current, data, layout || {}, config || {})
    })()
    return () => {
      mounted = false
      if (divRef.current && Plotly && Plotly.purge) {
        Plotly.purge(divRef.current)
      }
    }
  }, [data, layout, config])

  return <div ref={divRef} />
}
