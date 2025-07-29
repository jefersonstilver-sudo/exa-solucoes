import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import LinkaeStorytelling from '@/components/linkae/LinkaeStorytelling';
import LinkaeExamples from '@/components/linkae/LinkaeExamples';
import LinkaeDifferentiators from '@/components/linkae/LinkaeDifferentiators';
import LinkaeForm from '@/components/linkae/LinkaeForm';
import LinkaeFloatingCTA from '@/components/linkae/LinkaeFloatingCTA';
import Layout from '@/components/layout/Layout';

const Linkae = () => {
  console.log('📱 LINKAÊ: Inicializando página Social Media com tema claro');
  
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    console.log('📱 LINKAÊ: Scroll para formulário');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900">
        <LinkaeHero onScrollToForm={scrollToForm} />
        <LinkaeStorytelling />
        <LinkaeExamples />
        <LinkaeDifferentiators />
        <LinkaeForm formRef={formRef} />
        <LinkaeFloatingCTA onScrollToForm={scrollToForm} />
      </div>
    </Layout>
  );
};

export default Linkae;