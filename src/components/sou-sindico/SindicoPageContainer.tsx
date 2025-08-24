
import React from 'react';
import { useSindicoIntersectionObserver } from '@/hooks/sou-sindico/useSindicoIntersectionObserver';
import { useSindicoForm } from '@/hooks/sou-sindico/useSindicoForm';
import { benefits, howItWorksSteps } from './SindicoPageData';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects';
import HowItWorksSection from './HowItWorksSection';



import InterestFormSection from './InterestFormSection';
import ChecklistSection from './ChecklistSection';

const SindicoPageContainer: React.FC = () => {
  const {
    isVisible,
    visibleSections,
    heroRef,
    sectionsRef
  } = useSindicoIntersectionObserver();

  const {
    formData,
    setFormData,
    isSubmitting,
    handleSubmit
  } = useSindicoForm();

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Partículas de fundo */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40 delay-1000" />
        <div className="absolute bottom-60 left-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse opacity-50 delay-2000" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full animate-pulse opacity-30 delay-3000" />
      </div>

      {/* Sections */}
      <section ref={heroRef}>
        <HeroSection isVisible={isVisible} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['about'] = el; }}
        data-section="about"
      >
        <AboutSection isVisible={visibleSections['about']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['benefits'] = el; }}
        data-section="benefits"
      >
        <FeaturesSectionWithHoverEffects isVisible={visibleSections['benefits']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['how-it-works'] = el; }}
        data-section="how-it-works"
      >
        <HowItWorksSection isVisible={visibleSections['how-it-works']} steps={howItWorksSteps} />
      </section>




      <section 
        ref={(el) => { sectionsRef.current['checklist'] = el; }}
        data-section="checklist"
      >
        <ChecklistSection isVisible={visibleSections['checklist']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['form'] = el; }}
        data-section="form"
      >
        <InterestFormSection 
          isVisible={visibleSections['form']} 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </section>

    </div>
  );
};

export default SindicoPageContainer;
