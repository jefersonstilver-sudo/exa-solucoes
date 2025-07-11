import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import LinkaeMission from '@/components/linkae/LinkaeMission';
import LinkaeStrategy from '@/components/linkae/LinkaeStrategy';
import SocialMediaFramework from '@/components/linkae/SocialMediaFramework';
import ContentProcess from '@/components/linkae/ContentProcess';
import CreativeStudio from '@/components/linkae/CreativeStudio';
import AIContentSection from '@/components/linkae/AIContentSection';
import SocialMediaDeliverables from '@/components/linkae/SocialMediaDeliverables';
import SocialPortfolio from '@/components/linkae/SocialPortfolio';
import SocialObjections from '@/components/linkae/SocialObjections';
import LinkaeCTASection from '@/components/linkae/LinkaeCTASection';
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
        <LinkaeMission />
        <LinkaeStrategy />
        <SocialMediaFramework />
        <ContentProcess />
        <CreativeStudio />
        <AIContentSection />
        <SocialMediaDeliverables />
        <SocialPortfolio />
        <SocialObjections onScrollToForm={scrollToForm} />
        <LinkaeCTASection />
        <LinkaeForm formRef={formRef} />
        <LinkaeFloatingCTA onScrollToForm={scrollToForm} />
      </div>
    </Layout>
  );
};

export default Linkae;