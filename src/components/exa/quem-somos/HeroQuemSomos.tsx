import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageOptimization } from '@/hooks/usePageOptimization';

const HeroQuemSomos = () => {
  const { shouldReduceMotion, animationDuration } = usePageOptimization();
  const { ref, isVisible } = useScrollReveal({ 
    threshold: 0.1, 
    reducedMotion: shouldReduceMotion 
  });

  return (
    <ExaSection 
      background="transparent" 
      className="pt-32 md:pt-40 lg:pt-48 pb-16 md:pb-20 bg-gradient-to-br from-[#4A0E0E] via-[#6B1818] to-[#2D0808] relative overflow-hidden"
      paddingSize="lg"
    >
      {/* Efeito sutil de textura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,0,0,0.15),transparent_50%)] opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(128,0,32,0.12),transparent_50%)] opacity-40"></div>
      
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto relative z-10`}
        style={{
          transition: `all ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(1rem)'
        }}
      >
        <h1 className="text-responsive-h1 text-white font-montserrat mb-6 text-tracking-tight">
          Quem <span className="text-exa-yellow">Somos</span>
        </h1>
        <p className="text-responsive-body-lg text-white/90 font-inter max-w-3xl leading-relaxed">
          Conectamos tecnologia, informação e pessoas — com comunicação inteligente e humana.
        </p>
      </div>
    </ExaSection>
  );
};

export default HeroQuemSomos;
