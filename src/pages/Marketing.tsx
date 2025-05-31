
import React, { useRef } from 'react';
import MarketingHero from '@/components/marketing/MarketingHero';
import MarketingMission from '@/components/marketing/MarketingMission';
import MarketingPlanning from '@/components/marketing/MarketingPlanning';
import TacohFramework from '@/components/marketing/TacohFramework';
import ProcessSteps from '@/components/marketing/ProcessSteps';
import StudioSection from '@/components/marketing/StudioSection';
import AISection from '@/components/marketing/AISection';
import DeliverablesSection from '@/components/marketing/DeliverablesSection';
import PortfolioSection from '@/components/marketing/PortfolioSection';
import ObjectionsSection from '@/components/marketing/ObjectionsSection';
import CTASection from '@/components/marketing/CTASection';
import MarketingForm from '@/components/marketing/MarketingForm';
import FloatingCTA from '@/components/marketing/FloatingCTA';

const Marketing = () => {
  console.log('📄 Marketing: Inicializando página Marketing');
  
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    console.log('📄 Marketing: Scroll para formulário');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <MarketingHero onScrollToForm={scrollToForm} />
      <MarketingMission />
      <MarketingPlanning />
      <TacohFramework />
      <ProcessSteps />
      <StudioSection />
      <AISection />
      <DeliverablesSection />
      <PortfolioSection />
      <ObjectionsSection onScrollToForm={scrollToForm} />
      <CTASection />
      <MarketingForm formRef={formRef} />
      <FloatingCTA onScrollToForm={scrollToForm} />
    </div>
  );
};

export default Marketing;
