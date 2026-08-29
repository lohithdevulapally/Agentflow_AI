import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import useAuthStore from '../store/authStore';
import { getSocket } from '../services/socket';

export default function App({ Component, pageProps }) {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
    getSocket();
  }, [initAuth]);

  return (
    <>
      <Head>
        <title>Agentflow.AI - Operator Automation Platform</title>
        <meta
          name="description"
          content="Enterprise-grade AI Operations Automation Platform with 5-agent orchestration engine."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
