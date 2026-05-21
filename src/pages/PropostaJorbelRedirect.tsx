import { useEffect } from 'react';

/**
 * Força saída do SPA para servir o arquivo estático em public/proposta-jorbel/index.html.
 * Necessário para hosts que aplicam SPA fallback em /proposta-jorbel/ (request de diretório).
 */
const PropostaJorbelRedirect = () => {
  useEffect(() => {
    window.location.replace('/proposta-jorbel/index.html');
  }, []);

  return (
    <>
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/proposta-jorbel/index.html" />
      </noscript>
      <div style={{ minHeight: '100vh', background: '#07070c' }} />
    </>
  );
};

export default PropostaJorbelRedirect;
