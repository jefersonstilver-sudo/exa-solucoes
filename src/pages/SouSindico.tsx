import React from 'react';
import Layout from '@/components/layout/Layout';
import SindicoHeroSection from '@/components/exa/sindico/SindicoHeroSection';
import VideoPrincipalSection from '@/components/exa/sindico/VideoPrincipalSection';
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
  return (
    <Layout>
      <AnimatedBackground>
        <SindicoHeroSection />
        <VideoPrincipalSection />
        <NovaComunicacaoSection />
        <ComoFuncionaSection />
        <BeneficiosCondominioSection />
        <DesignValorizaSection />
        <PainelInteligenteSection />
        <CredibilidadeSection />
        <ExpansaoImpactoSection />
        
        {/* Logo Ticker Section */}
        <section className="bg-gradient-to-br from-exa-black via-exa-purple/10 to-exa-black py-16">
          <div className="container mx-auto px-[10%] max-w-[1440px]">
            <h2 className="font-montserrat font-bold text-3xl lg:text-4xl text-center text-white mb-8">
              Empresas que <span className="text-transparent bg-clip-text bg-gradient-to-r from-exa-purple to-exa-blue">confiam na EXA</span>
            </h2>
            <LogoTicker />
          </div>
        </section>
        
        <CTAFinalSindicoSection />
      </AnimatedBackground>
    </Layout>
  );
};

export default SouSindico;
