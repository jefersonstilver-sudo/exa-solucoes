
import React from 'react';
import Layout from '@/components/layout/Layout';
import IndexaProdutoraHero from '@/components/produtora/IndexaProdutoraHero';
import PremiumServicesSection from '@/components/produtora/PremiumServicesSection';
import TaccohMethodSection from '@/components/produtora/TaccohMethodSection';
import PortfolioShowcase from '@/components/produtora/PortfolioShowcase';
import InfrastructureSection from '@/components/produtora/InfrastructureSection';
import TestimonialsSection from '@/components/produtora/TestimonialsSection';
import ContactFormSection from '@/components/produtora/ContactFormSection';

const Produtora = () => {
  console.log('🎬 INDEXA PRODUTORA: Página da produtora premium carregada com nova identidade');

  return (
    <Layout>
      <div className="relative z-10 overflow-x-hidden w-full">
        {/* 1. Hero Premium - Posicionamento Estratégico */}
        <IndexaProdutoraHero />
        
        {/* 2. Nossos Serviços Premium */}
        <PremiumServicesSection />
        
        {/* 3. Método T.A.C.C.O.H. na Produção */}
        <TaccohMethodSection />
        
        {/* 4. Portfólio de Impacto */}
        <PortfolioShowcase />
        
        {/* 5. Infraestrutura de Ponta */}
        <InfrastructureSection />
        
        {/* 6. Depoimentos e Resultados */}
        <TestimonialsSection />
        
        {/* 7. Contato e Agendamento */}
        <ContactFormSection />
      </div>
    </Layout>
  );
};

export default Produtora;
