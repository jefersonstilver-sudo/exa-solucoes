import { useEffect } from 'react';

/**
 * Standalone redirect to the static HTML job posting page in /public.
 * Keeps the canonical URL /vagadevideomaker for SEO/sharing while serving
 * the original autocontido HTML (próprio topbar/footer, sem chrome global).
 */
const VagaVideomaker = () => {
  useEffect(() => {
    window.location.replace('/vaga-videomaker.html');
  }, []);

  return <div style={{ minHeight: '100vh', background: '#0A0606' }} />;
};

export default VagaVideomaker;
