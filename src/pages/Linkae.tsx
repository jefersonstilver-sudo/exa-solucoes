
import React, { useRef } from 'react';
import LinkaeHero from '@/components/linkae/LinkaeHero';
import TaccohPuzzleHero from '@/components/linkae/TaccohPuzzleHero';
import BeforeAfterPosts from '@/components/linkae/BeforeAfterPosts';
import TaccohExplainer from '@/components/linkae/TaccohExplainer';
import TaccohSolutionSection from '@/components/linkae/TaccohSolutionSection';
import LinkaeAdvantages from '@/components/linkae/LinkaeAdvantages';
import TaccohDiagnostic from '@/components/linkae/TaccohDiagnostic';
import LinkaeMission from '@/components/linkae/LinkaeMission';
import SocialMediaDeliverables from '@/components/linkae/SocialMediaDeliverables';
import SocialPortfolio from '@/components/linkae/SocialPortfolio';
import RealCases from '@/components/linkae/RealCases';
import SocialObjections from '@/components/linkae/SocialObjections';
import FinalCTA from '@/components/linkae/FinalCTA';
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
        <TaccohPuzzleHero />
        <BeforeAfterPosts />
        <TaccohSolutionSection />
        <TaccohExplainer />
        <LinkaeAdvantages />
        <TaccohDiagnostic onScrollToForm={scrollToForm} />
        <LinkaeMission />
        <SocialMediaDeliverables />
        <SocialPortfolio />
        <RealCases />
        <SocialObjections onScrollToForm={scrollToForm} />
        <FinalCTA onScrollToForm={scrollToForm} />
        <LinkaeCTASection />
        <LinkaeForm formRef={formRef} />
        <LinkaeFloatingCTA onScrollToForm={scrollToForm} />
      </div>
    </Layout>
  );
};

export default Linkae;
