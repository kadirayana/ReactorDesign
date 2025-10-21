import '../styles/globals.css'
import Layout from '../components/Layout'
import React from 'react';

function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default appWithTranslation(App, nextI18NextConfig)
