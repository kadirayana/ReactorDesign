import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="description" content="Reaktör tasarımı, kimyasal denge, ısı transferi ve dinamik simülasyon hesaplamaları için kapsamlı platform." />
        <link rel="icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
