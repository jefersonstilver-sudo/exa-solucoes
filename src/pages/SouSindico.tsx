import React from 'react';
import Layout from '@/components/layout/Layout';
import SindicoHeroSection from '@/components/exa/sindico/SindicoHeroSection';
import VideoPrincipalSection from '@/components/exa/sindico/VideoPrincipalSection';
import NovaComunicacaoSection from '@/components/exa/sindico/NovaComunicacaoSection';
import VideoSecundarioSection from '@/components/exa/sindico/VideoSecundarioSection';
import ComoFuncionaSection from '@/components/exa/sindico/ComoFuncionaSection';
import BeneficiosCondominioSection from '@/components/exa/sindico/BeneficiosCondominioSection';
import DesignValorizaSection from '@/components/exa/sindico/DesignValorizaSection';
import PainelInteligenteSection from '@/components/exa/sindico/PainelInteligenteSection';
import CredibilidadeSection from '@/components/exa/sindico/CredibilidadeSection';
import ExpansaoImpactoSection from '@/components/exa/sindico/ExpansaoImpactoSection';
import CTAFinalSindicoSection from '@/components/exa/sindico/CTAFinalSindicoSection';
import LogoTicker from '@/components/exa/LogoTicker';

const SouSindico = () => {
  return (
    <Layout className="bg-gradient-to-br from-gray-50 to-gray-100">
      <SindicoHeroSection />
      <VideoPrincipalSection />
      <NovaComunicacaoSection />
      <VideoSecundarioSection />
      <ComoFuncionaSection />
      <BeneficiosCondominioSection />
      <DesignValorizaSection />
      <PainelInteligenteSection />
      <CredibilidadeSection />
      <ExpansaoImpactoSection />
      <LogoTicker />
      <CTAFinalSindicoSection />
    </Layout>
  );
};

export default SouSindico;
