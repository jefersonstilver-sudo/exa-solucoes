import React from 'react';
import Layout from '@/components/layout/Layout';
import SindicoHeroSection from '@/components/exa/sindico/SindicoHeroSection';
import NovaComunicacaoSection from '@/components/exa/sindico/NovaComunicacaoSection';
import ComoFuncionaSection from '@/components/exa/sindico/ComoFuncionaSection';
import BeneficiosCondominioSection from '@/components/exa/sindico/BeneficiosCondominioSection';
import DesignValorizaSection from '@/components/exa/sindico/DesignValorizaSection';
import PainelInteligenteSection from '@/components/exa/sindico/PainelInteligenteSection';
import CredibilidadeSection from '@/components/exa/sindico/CredibilidadeSection';
import ExpansaoImpactoSection from '@/components/exa/sindico/ExpansaoImpactoSection';
import CTAFinalSindicoSection from '@/components/exa/sindico/CTAFinalSindicoSection';
import LogoTicker from '@/components/exa/LogoTicker';
import AnimatedBackground from '@/components/exa/sindico/AnimatedBackground';
const SouSindico = () => {
  return <Layout>
      <AnimatedBackground>
        <SindicoHeroSection />
        <NovaComunicacaoSection />
        <ComoFuncionaSection />
        <BeneficiosCondominioSection />
        <DesignValorizaSection />
        <PainelInteligenteSection />
        <CredibilidadeSection />
        <ExpansaoImpactoSection />
        
        {/* Logo Ticker Section */}
        
        
        <CTAFinalSindicoSection />
      </AnimatedBackground>
    </Layout>;
};
export default SouSindico;