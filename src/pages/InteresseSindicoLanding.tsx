import React, { useEffect } from 'react';
import HeroSection from '@/components/interesse-sindico/HeroSection';
import ProblemaSection from '@/components/interesse-sindico/ProblemaSection';
import DemonstracaoSection from '@/components/interesse-sindico/DemonstracaoSection';
import BeneficiosSection from '@/components/interesse-sindico/BeneficiosSection';
import ComoFuncionaSection from '@/components/interesse-sindico/ComoFuncionaSection';
import '@/components/interesse-sindico/styles.css';

const InteresseSindicoLanding: React.FC = () => {
  useEffect(() => {
    // Sempre abre a landing no topo (cobre voltar do navegador / refresh)
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = 'Interesse do Síndico | EXA Mídia';
    const meta = document.querySelector('meta[name="description"]');
    const rootElement = document.getElementById('root');

    document.documentElement.classList.add('public-page');
    document.body.classList.add('public-page');
    rootElement?.classList.add('public-page');

    if (meta) {
      meta.setAttribute(
        'content',
        'Painéis digitais EXA nos elevadores do seu prédio: Wi-Fi grátis, canal oficial de avisos e zero custo para o condomínio. Registre o interesse do seu prédio.'
      );
    }

    return () => {
      document.documentElement.classList.remove('public-page');
      document.body.classList.remove('public-page');
      rootElement?.classList.remove('public-page');
    };
  }, []);

  // Prefetch agressivo: chunk do formulário + Google Maps em background
  // enquanto o usuário lê a landing → CTA fica instantâneo no clique.
  useEffect(() => {
    const prefetchOnIdle = () => {
      // Chunk principal do formulário (mesmo import do React.lazy)
      import('@/pages/InteresseSindicoFormulario').catch(() => {});
      // Sub-componentes pesados que entram no bundle do form
      import('@/components/interesse-sindico-form/StepPredio').catch(() => {});
      import('@/components/interesse-sindico-form/StepSindico').catch(() => {});
      import('@/components/interesse-sindico-form/StepTermos').catch(() => {});
      import('@/components/interesse-sindico-form/EnderecoAutocomplete').catch(() => {});
      import('@/components/interesse-sindico-form/MiniMapa').catch(() => {});
      // Pré-injeta o <script> do Google Maps Places (singleton)
      import('@/utils/googleMapsLoader')
        .then((mod) => mod.loadGoogleMaps?.())
        .catch(() => {});
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(prefetchOnIdle, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(prefetchOnIdle, 500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="exa-theme font-inter w-full bg-[var(--exa-black)] text-white">
      <HeroSection />
      <ProblemaSection />
      <DemonstracaoSection />
      <BeneficiosSection />
      <ComoFuncionaSection />
    </div>
  );
};

export default InteresseSindicoLanding;
