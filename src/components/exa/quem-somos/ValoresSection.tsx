import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageOptimization } from '@/hooks/usePageOptimization';
import { Compass, Settings, Heart } from 'lucide-react';

const valores = [
  {
    icon: Compass,
    title: 'Propósito',
    description: 'Fortalecer a comunicação dentro dos condomínios, unindo administradores, moradores e marcas de forma respeitosa e inteligente.'
  },
  {
    icon: Settings,
    title: 'Tecnologia',
    description: 'Utilizamos sistemas próprios e players inteligentes que garantem estabilidade, design e segurança na entrega da informação.'
  },
  {
    icon: Heart,
    title: 'Compromisso',
    description: 'Comunicação que enriquece o ambiente, promove clareza e conecta pessoas com ética e transparência.'
  }
];

const ValoresSection = () => {
  const { shouldReduceMotion, animationDuration, isMobile } = usePageOptimization();
  const { ref, isVisible } = useScrollReveal({ 
    threshold: 0.2, 
    reducedMotion: shouldReduceMotion 
  });

  return (
    <ExaSection background="gradient" paddingSize="md" lazyLoad>
      <div 
        ref={ref}
        className="max-w-[1200px] mx-auto"
        style={{
          transition: `all ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(1rem)'
        }}
      >
        <h2 className="text-responsive-h2 text-[#111111] font-montserrat mb-8 md:mb-12 text-center text-tracking-tight">
          Valores e Propósito
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {valores.map((valor, index) => {
            const IconComponent = valor.icon;
            const gradients = [
              'from-[#9C1E1E] to-[#C8102E]',
              'from-purple-600 to-blue-600',
              'from-yellow-500 to-orange-500'
            ];
            
            return (
              <ExaCard 
                key={index} 
                variant="light" 
                className="text-center"
                hoverable={!isMobile}
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center`}>
                  <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-responsive-h4 text-[#111111] mb-3 font-montserrat">
                  {valor.title}
                </h3>
                <p className="text-responsive-body text-[#555555] font-inter leading-relaxed">
                  {valor.description}
                </p>
              </ExaCard>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};

export default ValoresSection;
