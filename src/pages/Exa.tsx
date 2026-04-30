import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { organizationSchema, webSiteSchema, createFAQSchema, homeFAQs, serviceSchema } from '@/components/seo/schemas';
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
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Layout className="bg-white pt-16">
      <SEO
        title="EXA | Publicidade Inteligente em Elevadores - Painéis Digitais Foz do Iguaçu"
        description="Transforme elevadores em mídia premium. Painéis digitais 21&quot; em prédios de alto padrão em Foz do Iguaçu. Teste GRÁTIS por 30 dias. Alcance 10.000+ moradores diariamente."
        keywords="painel digital elevador, publicidade elevador foz iguaçu, mídia indoor condomínio, digital signage elevador, tela publicidade prédio, screen elevador, display digital, publicidade condomínio, anúncio prédio residencial, mídia OOH indoor"
        canonical="https://www.examidia.com.br/"
        ogImage="https://www.examidia.com.br/og-home.jpg"
        structuredData={[
          organizationSchema,
          webSiteSchema,
          serviceSchema,
          createFAQSchema(homeFAQs)
        ]}
      />
      <div className="relative overflow-x-hidden w-full -mt-0 md:-mt-16">
        <HeroSection />
        
        {/* Logo Ticker - Full Width - posicionado abaixo do vídeo sem sobreposição no mobile */}
        <div className="relative z-30 -mt-2 md:-mt-20 lg:-mt-28 w-full bg-[#9C1E1E] overflow-hidden">
          <LogoTicker speed={60} pauseOnHover={true} showPortals={false} />
        </div>
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
