
import React from 'react';
import Layout from '@/components/layout/Layout';
import ProdutoraHeroSection from '@/components/produtora/ProdutoraHeroSection';
import AboutProdutoraSection from '@/components/produtora/AboutProdutoraSection';
import EstudioSection from '@/components/produtora/EstudioSection';
import ProcessoProducaoSection from '@/components/produtora/ProcessoProducaoSection';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CafeManualSection from '@/components/produtora/CafeManualSection';
import BriefingFormSection from '@/components/produtora/BriefingFormSection';
import ProdutoraFooter from '@/components/layout/ProdutoraFooter';

const Produtora = () => {
  console.log('Produtora: Página da produtora carregada');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Section */}
        <ProdutoraHeroSection />
        
        {/* 2. Sobre a Indexa Produtora */}
        <AboutProdutoraSection />
        
        {/* 3. Nosso Estúdio */}
        <EstudioSection />
        
        {/* 4. Como Funciona a Produção */}
        <ProcessoProducaoSection />
        
        {/* 5. Portfólio Cinematográfico */}
        <PortfolioSection />
        
        {/* 6. Convite ao Café + Manual Gratuito */}
        <CafeManualSection />
        
        {/* 7. Formulário de Briefing */}
        <BriefingFormSection />
        
        {/* 8. Footer */}
        <ProdutoraFooter />
      </div>
    </Layout>
  );
};

export default Produtora;
