import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const HeroQuemSomos = () => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <ExaSection background="transparent" className="pt-24 md:pt-40 lg:pt-56 pb-16 md:pb-20 bg-gradient-to-br from-[#4A0E0E] via-[#6B1818] to-[#2D0808] relative overflow-hidden">
      {/* Efeito sutil de textura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,0,0,0.15),transparent_50%)] opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(128,0,32,0.12),transparent_50%)] opacity-40"></div>
      
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 relative z-10 ${
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
