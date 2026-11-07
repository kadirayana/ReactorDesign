import Head from 'next/head';
import Navbar from './Navbar';
import { withBasePath } from '../src/lib/basePath';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kimya Mühendisliği Hesaplama Platformu</title>
        <meta name="description" content="Reaktör tasarımı, kimyasal denge, ısı transferi, distilasyon, akışkanlar ve dinamik simülasyon hesaplamaları için kapsamlı platform." />
        <link rel="icon" href={withBasePath('/logo.png')} />
        <link rel="manifest" href={withBasePath('/manifest.json')} />
      </Head>
      <Navbar />
      <main id="main-content">{children}</main>
    </>
  );
}
