import React, { memo } from 'react';
import { useSindicoIntersectionObserver } from '@/hooks/sou-sindico/useSindicoIntersectionObserver';
import { useSindicoForm } from '@/hooks/sou-sindico/useSindicoForm';
import { howItWorksSteps } from './SindicoPageData';

// Lazy imports for better performance
import OptimizedHeroSection from './OptimizedHeroSection';
import AboutSection from './AboutSection';
import { FeaturesSectionWithHoverEffects } from '@/components/ui/feature-section-with-hover-effects';
import HowItWorksSection from './HowItWorksSection';
import OptimizedChecklistSection from './OptimizedChecklistSection';
import InterestFormSection from './InterestFormSection';

// Memoized components for better performance
const MemoizedAboutSection = memo(AboutSection);
const MemoizedFeaturesSection = memo(FeaturesSectionWithHoverEffects);
const MemoizedHowItWorksSection = memo(HowItWorksSection);
const MemoizedInterestFormSection = memo(InterestFormSection);

const OptimizedSindicoPageContainer: React.FC = () => {
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Simplified background particles */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-60 left-1/4 w-1.5 h-1.5 bg-purple-300/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Optimized sections */}
      <section ref={heroRef}>
        <OptimizedHeroSection isVisible={isVisible} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['about'] = el; }}
        data-section="about"
      >
        <MemoizedAboutSection isVisible={visibleSections['about']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['benefits'] = el; }}
        data-section="benefits"
      >
        <MemoizedFeaturesSection isVisible={visibleSections['benefits']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['how-it-works'] = el; }}
        data-section="how-it-works"
      >
        <MemoizedHowItWorksSection 
          isVisible={visibleSections['how-it-works']} 
          steps={howItWorksSteps} 
        />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['checklist'] = el; }}
        data-section="checklist"
      >
        <OptimizedChecklistSection isVisible={visibleSections['checklist']} />
      </section>

      <section 
        ref={(el) => { sectionsRef.current['form'] = el; }}
        data-section="form"
      >
        <MemoizedInterestFormSection 
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

export default OptimizedSindicoPageContainer;