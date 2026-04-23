import React, { useEffect } from 'react';
import HeroSection from '@/components/interesse-sindico/HeroSection';
import ProblemaSection from '@/components/interesse-sindico/ProblemaSection';
import DemonstracaoSection from '@/components/interesse-sindico/DemonstracaoSection';
import BeneficiosSection from '@/components/interesse-sindico/BeneficiosSection';
import ComoFuncionaSection from '@/components/interesse-sindico/ComoFuncionaSection';
import '@/components/interesse-sindico/styles.css';

const InteresseSindicoLanding: React.FC = () => {
  useEffect(() => {
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
