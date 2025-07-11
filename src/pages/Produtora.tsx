
import React from 'react';
import Layout from '@/components/layout/Layout';
import ProdutoraHeroSection from '@/components/produtora/ProdutoraHeroSection';
import AboutProdutoraSection from '@/components/produtora/AboutProdutoraSection';
import EstudioSection from '@/components/produtora/EstudioSection';
import CreativeStudio from '@/components/linkae/CreativeStudio';
import ProcessoProducaoSection from '@/components/produtora/ProcessoProducaoSection';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CafeManualSection from '@/components/produtora/CafeManualSection';
import BriefingFormSection from '@/components/produtora/BriefingFormSection';

const Produtora = () => {
  console.log('🎬 Produtora: Página da produtora carregada SEM footer adicional');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Section */}
        <ProdutoraHeroSection />
        
        {/* 2. Sobre a Indexa Produtora */}
        <AboutProdutoraSection />
        
        {/* 3. Nosso Estúdio */}
        <EstudioSection />
        
        {/* 3.5. Studio Criativo Completo */}
        <CreativeStudio />
        
        {/* 4. Como Funciona a Produção */}
        <ProcessoProducaoSection />
        
        {/* 5. Portfólio Cinematográfico */}
        <PortfolioSection />
        
        {/* 6. Convite ao Café + Manual Gratuito */}
        <CafeManualSection />
        
        {/* 7. Formulário de Briefing */}
        <BriefingFormSection />
        
        {/* REMOVIDO: Qualquer footer adicional - apenas o Layout tem footer */}
      </div>
    </Layout>
  );
};

export default Produtora;
