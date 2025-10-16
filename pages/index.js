
import React from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>Ana Sayfa - Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
      </Head>
      <main className={styles.container}>
        <h1 className={styles.title}>Kompleks Hesaplama Platformu</h1>
        <p className={styles.intro}>
          Bu platform, çeşitli Kimya mühendisliği hesaplamalarını gerçekleştirmenize olanak sağlayan kapsamlı bir araçtır. Platformumuz aşağıdaki modülleri içermektedir:
        </p>
        <ul className={styles.moduleList}>
          <li>
            <strong>Reaktör Tasarımı:</strong> Bu sayfa, reaktör tasarımı ve görselleştirmesi üzerine kapsamlı bilgiler sunmaktadır. Ana konular arasında özelleştirilebilir reaktörler, kimyasal denge, ısı transferi ve dinamik simülasyon yer almaktadır. Farklı reaktör tipleri (PFR, CSTR, PBR, batch) ve reaksiyon dereceleri detaylı bir şekilde ele alınmıştır. Kullanıcılar, ekonomik analiz ve temel reaktör parametreleri gibi kriterleri değerlendirerek tasarım sürecini geliştirebilir. Sayfanın kullanıcı dostu yapısı ve görselleştirme seçenekleri, etkileşimi artırmakta ve bilgiye erişimi kolaylaştırmaktadır. <Link href="/reactor">Reaktör Tasarımı</Link>
          </li>
          <li>
            <strong>Özelleştirilebilir Reaktör:</strong> Bu sayfa, özelleştirilebilir reaktörlerin tasarımı için gerekli hesaplamaları detaylandırmaktadır. Kullanıcılar, ürün ve reaktan bilgilerini, proses koşullarını ve reaksiyon kinetiği parametrelerini girerek hesaplama yapabilirler. <Link href="/reactorss">Özelleştirilebilir Reaktör</Link>
          </li>
          <li>
            <strong>Kimyasal Denge:</strong> Bu sayfa, kimyasal denge hesaplamaları için gerekli araçları sunmaktadır. Kullanıcılar, farklı reaksiyon türlerini seçerek (örneğin, aA + bB ⇌ cC + dD) ve stokiyometrik katsayıları belirleyerek hesaplama yapabilirler. <Link href="/chemical">Kimyasal Denge</Link>
          </li>
          <li>
            <strong>Isı Transferi:</strong> Bu sayfa, ısı transferi ile ilgili çeşitli hesaplamaları gerçekleştirmek için gerekli araçları sunmaktadır. Kullanıcılar, ısı iletimi, taşınım ve ışınım gibi farklı ısı transfer yöntemlerini seçerek hesaplamalar yapabilirler. <Link href="/heattransfer">Isı Transferi</Link>
          </li>
          <li>
            <strong>Isı Entegrasyonu:</strong> Bu sayfa, iki soğuk akış ve iki sıcak akış için ısı entegrasyonu analizini gerçekleştirmek amacıyla gerekli hesaplamaları sunmaktadır. Kullanıcılar, ΔTmin değerini tanımlayarak hesaplama yapabilirler. <Link href="/heatintegration">Isı Entegrasyonu</Link>
          </li>
          <li>
            <strong>Dinamik Simülasyon:</strong> Bu sayfa, dinamik sistem simülasyonları için gerekli parametreleri ve hesaplamaları sunmaktadır. Kullanıcılar, çeşitli simülasyon türleri arasından seçim yaparak (dinamik simülasyon, CSTR, PFR, kimyasal denge hesaplaması vb.) simülasyon gerçekleştirebilirler. <Link href="/dynamics">Dinamik Simülasyon</Link>
          </li>
          <li>
            <strong>Vaporizer Tasarım:</strong> Bu sayfa, bir vaporizer tasarımı için gerekli hesaplamaları gerçekleştirmek amacıyla kullanıcıya çeşitli veriler girmesi için bir platform sunmaktadır. <Link href="/vaporizer">Vaporizer Tasarım</Link>
          </li>
        </ul>
        <p className={styles.selectModule}>
          Menüden ihtiyacınız olan bölümü seçerek ilgili hesaplamaları gerçekleştirebilirsiniz.
        </p>
      </main>
    </>
  );
}
