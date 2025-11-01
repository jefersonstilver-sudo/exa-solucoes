import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const HeroQuemSomos = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <ExaSection background="transparent" className="pt-24 md:pt-32 pb-8 md:pb-12">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-[#111111] font-montserrat">
          Quem Somos
        </h1>
      </div>
    </ExaSection>
  );
};

export default HeroQuemSomos;
