
import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import TaccohStorytellingHero from '@/components/linkae/TaccohStorytellingHero';
import BeforeAfterShowcase from '@/components/linkae/BeforeAfterShowcase';
import LinkaeAdvantagesGrid from '@/components/linkae/LinkaeAdvantagesGrid';
import FinalCTASection from '@/components/linkae/FinalCTASection';
import LinkaeForm from '@/components/linkae/LinkaeForm';
import Layout from '@/components/layout/Layout';

const Linkae = () => {
  console.log('📱 LINKAÊ: Inicializando página simplificada com 5 seções essenciais');
  
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    console.log('📱 LINKAÊ: Scroll para formulário');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900">
        {/* 1. Hero Section (80vh) */}
        <LinkaeHero onScrollToForm={scrollToForm} />
        
        {/* 2. Storytelling Integrado com TACCOH (80vh) */}
        <TaccohStorytellingHero />
        
        {/* 3. Exemplos Visuais (Antes e Depois) */}
        <BeforeAfterShowcase />
        
        {/* 4. Diferenciais (Grid com Ícones) */}
        <LinkaeAdvantagesGrid />
        
        {/* 5. CTA Final (Chamada para Ação) */}
        <FinalCTASection onScrollToForm={scrollToForm} />
        
        {/* Formulário */}
        <LinkaeForm formRef={formRef} />
      </div>
    </Layout>
  );
};

export default Linkae;
