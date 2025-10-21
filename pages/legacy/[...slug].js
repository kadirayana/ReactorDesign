import Link from 'next/link';
import fs from 'fs';
import path from 'path';
export default function LegacyPage({ page, src }) {
  if (!page) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Eski Sayfa: {page}.html</h1>
      <p>
        Bu sayfa <code>/public/legacy/{page}.html</code> adresindeki eski statik dosyayı
        bir iframe içinde gösterir. Taşıma işlemi sırasında davranışları karşılaştırmak için kullanın.
      </p>
      <p>
        <Link href="/legacy">← Eski sayfa dizinine geri dön</Link>
      </p>
      <div style={{ border: '1px solid #ddd', height: '80vh', background: '#f9f9f9' }}>
        <iframe
          src={src}
          style={{ width: '100%', height: '100%', border: 0 }}
          title={`legacy-${page}`}
        />
      </div>
    </div>
  );
}

// Derleme sırasında çalışır ve her bir yol için gerekli verileri hazırlar.
export async function getStaticProps(context) {
  const { slug } = context.params;
  
  // slug bir dizi olabilir (ör: /legacy/path/to/page -> ['path', 'to', 'page'])
  // Onu tek bir string'e dönüştürüyoruz.
  const page = Array.isArray(slug) ? slug.join('/') : slug;
  const src = `/ReactorDesign/legacy/${page}.html`; // basePath'i burada ekliyoruz

  return {
    props: {
      page,
      src,
    },
  };
}

export async function getStaticPaths() {
  const legacyDir = path.join(process.cwd(), 'public', 'legacy');

  const getHtmlFiles = (dir) => {
    let files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = [...files, ...getHtmlFiles(fullPath)];
      } else if (item.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
    return files;
  };

  const files = getHtmlFiles(legacyDir);

  const paths = files.map((file) => {
    const slug = file
      .replace(legacyDir, '') 
      .replace('.html', '')   
      .split(path.sep)      
      .filter(Boolean);      

    return {
      params: { slug },
    };
  });

  return {
    paths,
    fallback: false, 
  };
}
