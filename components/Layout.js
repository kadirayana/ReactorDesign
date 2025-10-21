import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ReactorDesign Migration</title>
        {/* favicon for browser tab (place public/logo.png) */}
        <link rel="icon" href="public/logo.png" />
      </Head>
      <Navbar />
      <main className="main-content" style={{ paddingTop: 16 }}>{children}</main>
    </>
  );
}
