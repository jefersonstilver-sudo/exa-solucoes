import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const HeroQuemSomos = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <ExaSection background="transparent" className="pt-32 md:pt-40 pb-16 md:pb-24">
      <div 
        ref={ref}
        className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logotipo */}
        <div className="mb-8 md:mb-12">
          <img 
            src="/lovable-uploads/exa-logo.png" 
            alt="EXA Soluções Digitais"
            className="h-16 md:h-20 mx-auto"
          />
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] mb-6 font-montserrat">
          Quem Somos
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl lg:text-2xl text-[#555555] font-inter leading-relaxed">
          Conectamos tecnologia, informação e pessoas — com comunicação inteligente e humana.
        </p>
      </div>
    </ExaSection>
  );
};

export default HeroQuemSomos;
