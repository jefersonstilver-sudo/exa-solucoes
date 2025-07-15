
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/produtora/HeroSection';
import HistorySection from '@/components/produtora/HistorySection';
import DiferenciaisSection from '@/components/produtora/DiferenciaisSection';
import PortfolioSection from '@/components/produtora/PortfolioSection';
import CTASection from '@/components/produtora/CTASection';
import FooterSection from '@/components/produtora/FooterSection';

const Produtora = () => {
  return (
    <Layout>
      <div className="relative overflow-x-hidden">
        {/* Hero Cinematográfico */}
        <HeroSection />
        
        {/* Nossa História */}
        <HistorySection />
        
        {/* Diferenciais Únicos */}
        <DiferenciaisSection />
        
        {/* Portfólio Impactante */}
        <PortfolioSection />
        
        {/* Chamada para Ação */}
        <CTASection />
        
        {/* Footer */}
        <FooterSection />
      </div>
    </Layout>
  );
};

export default Produtora;
