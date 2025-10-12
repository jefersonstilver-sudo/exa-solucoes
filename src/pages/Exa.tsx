import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/exa/home/HeroSection';
import OQueESection from '@/components/exa/home/OQueESection';
import SolucoesSection from '@/components/exa/home/SolucoesSection';
import PorQueFuncionaSection from '@/components/exa/home/PorQueFuncionaSection';
import NumerosSection from '@/components/exa/home/NumerosSection';
import DesignExperienciaSection from '@/components/exa/home/DesignExperienciaSection';
import ProgramacaoSection from '@/components/exa/home/ProgramacaoSection';
import ParceriasSection from '@/components/exa/home/ParceriasSection';
import ExpansaoSection from '@/components/exa/home/ExpansaoSection';
import LogoTicker from '@/components/exa/LogoTicker';
import CTAFinalSection from '@/components/exa/home/CTAFinalSection';
import FloatingCTA from '@/components/exa/FloatingCTA';

const Exa = () => {
  console.log('🚀 EXA: Renderizando nova página revitalizada');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.overflowX = 'auto';
      document.documentElement.style.overflowX = 'auto';
    };
  }, []);

  return (
    <Layout className="bg-white">
      <div className="relative overflow-x-hidden w-full">
        <HeroSection />
        
        {/* Logo Ticker - Full Width */}
        <LogoTicker speed={60} pauseOnHover={true} showPortals={false} />
        
        <OQueESection />
        <SolucoesSection />
        <PorQueFuncionaSection />
        <NumerosSection />
        <DesignExperienciaSection />
        <ProgramacaoSection />
        <ParceriasSection />
        <ExpansaoSection />
        <CTAFinalSection />
        <FloatingCTA />
      </div>
    </Layout>
  );
};

export default Exa;
