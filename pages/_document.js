import { Html, Head, Main, NextScript } from 'next/document';

// Applies the saved theme before first paint so dark-mode users don't see a light flash.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <meta name="theme-color" content="#2563EB" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
