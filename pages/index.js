
import React from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

// Module definitions with icons and short descriptions
const modules = [
  {
    href: "/reactor",
    title: "Reaktör Tasarımı",
    desc: "PFR, CSTR, PBR ve batch reaktör tipleri için tasarım hesaplamaları ve görselleştirme.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6v8l4 7H5l4-7V3z" /><path d="M9 3h6" />
        <circle cx="13" cy="15" r="1" fill="currentColor" /><circle cx="10" cy="17" r="0.8" fill="currentColor" />
      </svg>
    ),
    color: "#2563EB",
  },
  {
    href: "/reactorss",
    title: "Özelleştirilebilir Reaktör",
    desc: "Ürün, reaktan ve kinetik parametreleri ile özel reaktör tasarımı.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 6V4M17 6V4M7 18v2M17 18v2" />
        <circle cx="12" cy="12" r="3" /><path d="M12 9v1M12 14v1M9 12h1M14 12h1" />
      </svg>
    ),
    color: "#7C3AED",
  },
  {
    href: "/chemical",
    title: "Kimyasal Denge",
    desc: "Stokiyometrik katsayılar ve denge hesaplamaları aracı.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v6l-2 8a2 2 0 002 2h12a2 2 0 002-2l-2-8V3" />
        <path d="M6 3h12" /><path d="M8 14h8" />
      </svg>
    ),
    color: "#059669",
  },
  {
    href: "/heattransfer",
    title: "Isı Transferi",
    desc: "İletim, taşınım, ışınım ve ısı değiştirici hesaplamaları.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 0-1 9.9V18h2V11.9A5 5 0 0 0 12 2z" />
        <rect x="10" y="18" width="4" height="4" rx="1" />
      </svg>
    ),
    color: "#DC2626",
  },
  {
    href: "/heatintegration",
    title: "Isı Entegrasyonu",
    desc: "Pinç analizi ile ısı entegrasyonu ve minimum utility hesabı.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
    color: "#D97706",
  },
  {
    href: "/dynamics",
    title: "Dinamik Simülasyon",
    desc: "CSTR, PFR ve çeşitli dinamik sistem simülasyonları.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L11 3l-3 9H4" />
      </svg>
    ),
    color: "#0891B2",
  },
  {
    href: "/vaporizer",
    title: "Vaporizer Tasarım",
    desc: "Vaporizer ısı değiştirici tasarımı ve iteratif hesaplamalar.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4" />
        <path d="M12 12V4" />
        <path d="M8 8c-2 0-4 1-4 4s2 4 4 4" /><path d="M16 8c2 0 4 1 4 4s-2 4-4 4" />
      </svg>
    ),
    color: "#9333EA",
  },
  {
    href: "/optimization",
    title: "Optimizasyon",
    desc: "Reaktör parametrelerinin optimizasyonu ve hassasiyet analizi.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
    color: "#E11D48",
  },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Ana Sayfa - Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>
      <div className={styles.container}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Kimya Mühendisliği<br />Hesaplama Platformu</h1>
          <p className={styles.heroDesc}>
            Reaktör tasarımı, kimyasal denge, ısı transferi ve dinamik simülasyon için profesyonel mühendislik araçları.
          </p>
        </div>

        {/* Module Grid */}
        <div className={styles.moduleGrid}>
          {modules.map((mod) => (
            <Link href={mod.href} key={mod.href} legacyBehavior>
              <a className={styles.moduleCard}>
                <div className={styles.cardIcon} style={{ background: `${mod.color}12`, color: mod.color }}>
                  {mod.icon}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{mod.title}</h3>
                  <p className={styles.cardDesc}>{mod.desc}</p>
                </div>
                <span className={styles.cardArrow}>→</span>
              </a>
            </Link>
          ))}
        </div>

        <p className={styles.selectModule}>
          Menüden veya yukarıdaki kartlardan bir modül seçerek hesaplamalara başlayın.
        </p>
      </div>
    </>
  );
}
