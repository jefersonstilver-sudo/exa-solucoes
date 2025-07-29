
import React from 'react';
import Layout from '@/components/layout/Layout';
import ProdutoraHeroSection from '@/components/produtora/ProdutoraHeroSection';
import StorytellingSection from '@/components/produtora/StorytellingSection';
import DiferenciaisSection from '@/components/produtora/DiferenciaisSection';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CafeManualSection from '@/components/produtora/CafeManualSection';
import CTAFinalSection from '@/components/produtora/CTAFinalSection';
import BriefingFormSection from '@/components/produtora/BriefingFormSection';

const Produtora = () => {
  console.log('🎬 Produtora: Página da produtora carregada SEM footer adicional');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Section (80vh) */}
        <ProdutoraHeroSection />
        
        {/* 2. Storytelling Emocional (80vh) */}
        <StorytellingSection />
        
        {/* 3. Diferenciais (Grid 3 Cards, 60vh) */}
        <DiferenciaisSection />
        
        {/* 4. Portfólio com Botões por Categoria (80vh) */}
        <PortfolioSection />
        
        {/* 5. Convite ao Café + Manual Gratuito */}
        <CafeManualSection />
        
        {/* 6. CTA Final (40vh) */}
        <CTAFinalSection />
        
        {/* 7. Formulário de Briefing */}
        <BriefingFormSection />
      </div>
    </Layout>
  );
};

export default Produtora;
