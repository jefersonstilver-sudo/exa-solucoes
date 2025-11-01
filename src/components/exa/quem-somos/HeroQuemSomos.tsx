import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const HeroQuemSomos = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <ExaSection background="gradient" className="pt-32 md:pt-40 lg:pt-48 pb-16 md:pb-20">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-montserrat mb-6">
          Quem <span className="text-exa-yellow">Somos</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 font-inter max-w-3xl leading-relaxed">
          Conectamos tecnologia, informação e pessoas — com comunicação inteligente e humana.
        </p>
      </div>
    </ExaSection>
  );
};

export default HeroQuemSomos;
