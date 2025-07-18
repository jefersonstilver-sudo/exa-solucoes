
import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import TaccohPuzzleHero from '@/components/linkae/TaccohPuzzleHero';
import SegmentExamples from '@/components/linkae/SegmentExamples';
import TaccohExplainer from '@/components/linkae/TaccohExplainer';
import TaccohSolutionSection from '@/components/linkae/TaccohSolutionSection';
import TaccohCaseStudies from '@/components/linkae/TaccohCaseStudies';
import TaccohDiagnostic from '@/components/linkae/TaccohDiagnostic';
import LinkaeMission from '@/components/linkae/LinkaeMission';
import SocialMediaDeliverables from '@/components/linkae/SocialMediaDeliverables';
import SocialPortfolio from '@/components/linkae/SocialPortfolio';
import SocialObjections from '@/components/linkae/SocialObjections';
import LinkaeCTASection from '@/components/linkae/LinkaeCTASection';
import LinkaeForm from '@/components/linkae/LinkaeForm';
import LinkaeFloatingCTA from '@/components/linkae/LinkaeFloatingCTA';
import Layout from '@/components/layout/Layout';

const Linkae = () => {
  console.log('📱 LINKAÊ: Inicializando página com nova identidade de Marketing Estratégico');
  
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    console.log('📱 LINKAÊ: Scroll para formulário de estratégias personalizadas');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900">
        {/* Hero Section Transformado (80vh) */}
        <LinkaeHero onScrollToForm={scrollToForm} />
        
        {/* Método T.A.C.C.O.H. - Quebra-cabeça */}
        <TaccohPuzzleHero />
        
        {/* NOVA SEÇÃO: Exemplos por Segmento */}
        <SegmentExamples />
        
        {/* Solução T.A.C.C.O.H. com Storytelling */}
        <TaccohSolutionSection />
        
        {/* Explicação Detalhada do T.A.C.C.O.H. */}
        <TaccohExplainer />
        
        {/* Cases de Estudo */}
        <TaccohCaseStudies />
        
        {/* Diagnóstico Personalizado */}
        <TaccohDiagnostic onScrollToForm={scrollToForm} />
        
        {/* Missão da Linkaê */}
        <LinkaeMission />
        
        {/* Entregáveis */}
        <SocialMediaDeliverables />
        
        {/* Portfólio */}
        <SocialPortfolio />
        
        {/* Objeções */}
        <SocialObjections onScrollToForm={scrollToForm} />
        
        {/* CTA Section */}
        <LinkaeCTASection />
        
        {/* Formulário */}
        <LinkaeForm formRef={formRef} />
        
        {/* CTA Flutuante */}
        <LinkaeFloatingCTA onScrollToForm={scrollToForm} />
      </div>
    </Layout>
  );
};

export default Linkae;
