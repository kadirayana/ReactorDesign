import fs from 'fs'
import path from 'path'
import Link from 'next/link'

export async function getStaticProps() {
  const legacyDir = path.join(process.cwd(), 'public', 'legacy')
  let files = []
  try {
    files = fs.readdirSync(legacyDir).filter(f => f.endsWith('.html'))
  } catch (e) {
    files = []
  }
  return { props: { files } }
}

export default function LegacyIndex({ files }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Legacy pages</h1>
      <p>Click a page to open it inside an iframe wrapper for safe inspection while migrating.</p>
      <ul>
        {files.map(f => (
          <li key={f}><Link href={`/legacy/${f.replace('.html','')}`}>{f}</Link></li>
        ))}
      </ul>
    </div>
  )
}
