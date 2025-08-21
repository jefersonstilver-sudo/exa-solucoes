import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ExaHeroSection from '@/components/exa/ExaHeroSection';
import AboutExaSection from '@/components/exa/AboutExaSection';
import ExaWhatIsSection from '@/components/exa/ExaWhatIsSection';
import ExaStrategicDifferentialsSection from '@/components/exa/ExaStrategicDifferentialsSection';
import ExaRealTimeAttractionsSection from '@/components/exa/ExaRealTimeAttractionsSection';
import ExaScaleExpansionSection from '@/components/exa/ExaScaleExpansionSection';
import ExaFinalPurchaseSection from '@/components/exa/ExaFinalPurchaseSection';
import LogoTicker from '@/components/exa/LogoTicker';

const Exa = () => {
  console.log('🚀 EXA: Renderizando página Publicidade Inteligente');

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.overflowX = 'auto';
      document.documentElement.style.overflowX = 'auto';
    };
  }, []);

  return (
    <Layout className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="relative overflow-x-hidden w-full">
        <ExaHeroSection />
        <AboutExaSection />
        <ExaWhatIsSection />
        <ExaStrategicDifferentialsSection />
        <ExaRealTimeAttractionsSection />
        <ExaScaleExpansionSection />
        <LogoTicker />
        <ExaFinalPurchaseSection />
      </div>
    </Layout>
  );
};

export default Exa;