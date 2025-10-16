import { useRouter } from 'next/router'
import Link from 'next/link'

export default function LegacyPage() {
  const router = useRouter()
  const { slug } = router.query
  // slug can be array or string
  const page = Array.isArray(slug) ? slug.join('/') : slug || 'index'
  const src = `/legacy/${page}.html`

  return (
    <div style={{ padding: 24 }}>
      <h1>Legacy page: {page}.html</h1>
      <p>
        This page displays the legacy static file from <code>/public/legacy/{page}.html</code> inside an iframe. Use this to compare behavior while migrating.
      </p>
      <p>
        <Link href="/legacy">← Back to legacy index</Link>
      </p>
      <div style={{ border: '1px solid #ddd', height: '80vh' }}>
        <iframe src={src} style={{ width: '100%', height: '100%', border: 0 }} title={`legacy-${page}`} />
      </div>
    </div>
  )
}
