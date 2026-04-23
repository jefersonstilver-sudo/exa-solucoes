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
    if (meta) {
      meta.setAttribute(
        'content',
        'Painéis digitais EXA nos elevadores do seu prédio: Wi-Fi grátis, canal oficial de avisos e zero custo para o condomínio. Registre o interesse do seu prédio.'
      );
    }
  }, []);

  return (
    <div className="exa-theme font-inter min-h-screen bg-[var(--exa-black)] text-white overflow-x-hidden">
      <HeroSection />
      <ProblemaSection />
      <DemonstracaoSection />
      <BeneficiosSection />
      <ComoFuncionaSection />
    </div>
  );
};

export default InteresseSindicoLanding;
