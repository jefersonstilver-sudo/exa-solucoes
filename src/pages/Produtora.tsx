
import React from 'react';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import ProdutoraHeroSection from '@/components/produtora/ProdutoraHeroSection';
import StorytellingSection from '@/components/produtora/StorytellingSection';
import DiferenciaisSection from '@/components/produtora/DiferenciaisSection';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CTAFinalSection from '@/components/produtora/CTAFinalSection';
import BriefingFormSection from '@/components/produtora/BriefingFormSection';
import CafeManualSection from '@/components/produtora/CafeManualSection';

const Produtora = () => {
  console.log('🎬 Produtora: Página da produtora atualizada conforme mapa mental');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Section (80vh) */}
        <ErrorBoundary>
          <ProdutoraHeroSection />
        </ErrorBoundary>
        
        {/* 2. Storytelling Emocional (80vh) */}
        <ErrorBoundary>
          <StorytellingSection />
        </ErrorBoundary>
        
        {/* 3. Diferenciais (60vh) */}
        <ErrorBoundary>
          <DiferenciaisSection />
        </ErrorBoundary>
        
        {/* 4. Portfólio com Filtros (80vh) */}
        <ErrorBoundary>
          <PortfolioSection />
        </ErrorBoundary>
        
        {/* 5. CTA Final (40vh) */}
        <ErrorBoundary>
          <CTAFinalSection />
        </ErrorBoundary>
        
        {/* 6. Café Manual Section */}
        <ErrorBoundary>
          <CafeManualSection />
        </ErrorBoundary>
        
        {/* 7. Formulário de Briefing */}
        <ErrorBoundary>
          <BriefingFormSection />
        </ErrorBoundary>
      </div>
    </Layout>
  );
};

export default Produtora;
