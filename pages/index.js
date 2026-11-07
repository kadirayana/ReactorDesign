import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { categories, modules } from '../components/modules';

const features = [
  { icon: '✅', title: 'Doğrulanmış formüller', text: 'Çekirdek hesaplar ders kitabı ve analitik çözümlerle birim testlerinden geçer.' },
  { icon: '⚡', title: 'Tamamen tarayıcıda', text: 'Sunucu yok; girdiler cihazınızdan çıkmaz, sonuçlar anında hesaplanır.' },
  { icon: '📈', title: 'Grafik ve dışa aktarma', text: 'Profiller etkileşimli grafiklerle gösterilir, CSV olarak indirilebilir.' },
  { icon: '🌙', title: 'Açık / koyu tema', text: 'Sistem temanızı izler; menüden elle de değiştirebilirsiniz.' },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Ana Sayfa · Kimya Mühendisliği Hesaplama Platformu</title>
      </Head>
      <div className={styles.container}>
        <section className={styles.hero}>
          <span className={styles.heroBadge}>{modules.length} hesaplama modülü · Ücretsiz · Açık kaynak</span>
          <h1 className={styles.heroTitle}>Kimya mühendisliği hesaplarınız<br />tek bir yerde</h1>
          <p className={styles.heroDesc}>
            Reaktör tasarımından distilasyon kolonuna, ısı değiştiriciden pompa seçimine kadar
            proses mühendisliği hesaplarını birim ve varsayımları açıkça belirtilmiş araçlarla yapın.
          </p>
          <div className={styles.heroActions}>
            <Link href="/reactor" legacyBehavior><a className="btn">Reaktör tasarımına başla →</a></Link>
            <Link href="/distillation" legacyBehavior><a className="btn btn-secondary">Yeni: Distilasyon</a></Link>
          </div>
        </section>

        {categories.map(cat => (
          <section key={cat.id} className={styles.category}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>{cat.title}</h2>
              <p className={styles.categoryDesc}>{cat.desc}</p>
            </div>
            <div className={styles.moduleGrid}>
              {modules.filter(m => m.category === cat.id).map(mod => (
                <Link href={mod.href} key={mod.href} legacyBehavior>
                  <a className={styles.moduleCard} style={{ '--module-color': mod.color }}>
                    <div className={styles.cardIcon} aria-hidden>{mod.icon}</div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>
                        {mod.title}
                        {mod.isNew && <span className="badge badge-success">Yeni</span>}
                      </h3>
                      <p className={styles.cardDesc}>{mod.desc}</p>
                    </div>
                    <span className={styles.cardArrow} aria-hidden>→</span>
                  </a>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className={styles.features} aria-label="Özellikler">
          {features.map(f => (
            <div key={f.title} className={styles.feature}>
              <span className={styles.featureIcon} aria-hidden>{f.icon}</span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
