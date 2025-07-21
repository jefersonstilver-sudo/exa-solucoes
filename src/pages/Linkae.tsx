
import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import TaccohStorytellingHero from '@/components/linkae/TaccohStorytellingHero';
import RobustCaseStudies from '@/components/linkae/RobustCaseStudies';
import LinkaeAdvantagesGrid from '@/components/linkae/LinkaeAdvantagesGrid';
import FinalCTASection from '@/components/linkae/FinalCTASection';
import LinkaeForm from '@/components/linkae/LinkaeForm';
import Layout from '@/components/layout/Layout';

const Linkae = () => {
  console.log('📱 LINKAÊ: Inicializando página com nova seção de casos robustos');
  
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    console.log('📱 LINKAÊ: Scroll para formulário');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900">
        {/* 1. Hero Section */}
        <LinkaeHero onScrollToForm={scrollToForm} />
        
        {/* 2. Storytelling Integrado com TACCOH */}
        <TaccohStorytellingHero />
        
        {/* 3. Casos Reais Robustos (Nova Seção) */}
        <RobustCaseStudies />
        
        {/* 4. Diferenciais */}
        <LinkaeAdvantagesGrid />
        
        {/* 5. CTA Final */}
        <FinalCTASection onScrollToForm={scrollToForm} />
        
        {/* Formulário */}
        <LinkaeForm formRef={formRef} />
      </div>
    </Layout>
  );
};

export default Linkae;
