import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ExaHeroSection from '@/components/exa/ExaHeroSection';
import AboutExaSection from '@/components/exa/AboutExaSection';
import SmartAdvertisingSection from '@/components/exa/SmartAdvertisingSection';
import IntelligentSystemsSection from '@/components/exa/IntelligentSystemsSection';
import ExaAdvantagesSection from '@/components/exa/ExaAdvantagesSection';
import ExaShowcaseSection from '@/components/exa/ExaShowcaseSection';
import ExaAnalyticsSection from '@/components/exa/ExaAnalyticsSection';
import ExaFAQSection from '@/components/exa/ExaFAQSection';
import ExaFinalCTASection from '@/components/exa/ExaFinalCTASection';

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
        <SmartAdvertisingSection />
        <IntelligentSystemsSection />
        <ExaAdvantagesSection />
        <ExaShowcaseSection />
        <ExaAnalyticsSection />
        <ExaFAQSection />
        <ExaFinalCTASection />
      </div>
    </Layout>
  );
};

export default Exa;