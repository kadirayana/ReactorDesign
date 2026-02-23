import '../styles/globals.css';
import Layout from '../components/Layout';
import ErrorBoundary from '../components/ErrorBoundary';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ErrorBoundary>
  );
}
