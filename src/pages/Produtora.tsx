
import React from 'react';
import Layout from '@/components/layout/Layout';
import CinematicHeroSection from '@/components/produtora/CinematicHeroSection';
import SuperStudioInfrastructure from '@/components/produtora/SuperStudioInfrastructure';
import StudioUsageModalities from '@/components/produtora/StudioUsageModalities';
import ProductionTypesShowcase from '@/components/produtora/ProductionTypesShowcase';
import TaccohIntegratedProcess from '@/components/produtora/TaccohIntegratedProcess';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CafeManualSection from '@/components/produtora/CafeManualSection';
import BriefingFormSection from '@/components/produtora/BriefingFormSection';

const Produtora = () => {
  console.log('🎬 Produtora: Página da produtora carregada SEM footer adicional');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Cinematográfico */}
        <CinematicHeroSection />
        
        {/* 2. Super Estúdio Infraestrutura */}
        <SuperStudioInfrastructure />
        
        {/* 3. Modalidades de Uso */}
        <StudioUsageModalities />
        
        {/* 4. Tipos de Produção */}
        <ProductionTypesShowcase />
        
        {/* 5. Processo T.A.C.C.O.H. Integrado */}
        <TaccohIntegratedProcess />
        
        {/* 6. Portfólio Cinematográfico */}
        <PortfolioSection />
        
        {/* 7. Convite ao Café */}
        <CafeManualSection />
        
        {/* 8. Formulário de Orçamento */}
        <BriefingFormSection />
      </div>
    </Layout>
  );
};

export default Produtora;
