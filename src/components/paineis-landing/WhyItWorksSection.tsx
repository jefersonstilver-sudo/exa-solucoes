
import React from 'react';
import { reasons } from './why-it-works/reasonsData';
import ReasonCard from './why-it-works/ReasonCard';
import NavigationDots from './why-it-works/NavigationDots';
import ResultSummary from './why-it-works/ResultSummary';
import { useWhyItWorksAnimation } from './why-it-works/useWhyItWorksAnimation';

const WhyItWorksSection = () => {
  const { isVisible, activeStep, setActiveStep, sectionRef } = useWhyItWorksAnimation(reasons.length);

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-gradient-to-br from-black to-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              Por que funciona tanto?
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/80 mb-12 sm:mb-16 text-center max-w-4xl mx-auto">
            Dados que comprovam a efetividade dos painéis em elevadores
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {reasons.map((reason, index) => (
              <ReasonCard
                key={index}
                {...reason}
                isActive={index === activeStep}
                index={index}
                isVisible={isVisible}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </div>

          <NavigationDots
            itemsCount={reasons.length}
            activeIndex={activeStep}
            onDotClick={setActiveStep}
          />

          <ResultSummary />
        </div>
      </div>
    </section>
  );
};

export default WhyItWorksSection;
