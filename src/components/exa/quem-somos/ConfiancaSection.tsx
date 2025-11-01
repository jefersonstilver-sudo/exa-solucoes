import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePageOptimization } from '@/hooks/usePageOptimization';
import { Award, Shield, MapPin } from 'lucide-react';

const confianca = [
  {
    icon: Award,
    title: 'Validado pelo Secovi Paraná',
    description: 'Modelo de negócio aprovado e apoiado pelo Sindicato da Habitação do Paraná, garantindo ética e transparência.'
  },
  {
    icon: Shield,
    title: 'Tecnologia Própria e Segura',
    description: 'Players inteligentes e sistemas desenvolvidos internamente, assegurando estabilidade, design e proteção de dados.'
  },
  {
    icon: MapPin,
    title: 'Presença Local em Foz do Iguaçu',
    description: 'Empresa sediada em Foz do Iguaçu – PR, com atendimento próximo e comprometido com a região.'
  }
];

const ConfiancaSection = () => {
  const { shouldReduceMotion, animationDuration, isMobile } = usePageOptimization();
  const { ref, isVisible } = useScrollReveal({ 
    threshold: 0.2, 
    reducedMotion: shouldReduceMotion 
  });

  return (
    <ExaSection background="dark" paddingSize="md" lazyLoad>
      <div 
        ref={ref}
        className="max-w-[1200px] mx-auto"
        style={{
          transition: `all ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(1rem)'
        }}
      >
        <h2 className="text-responsive-h2 text-white font-montserrat mb-8 md:mb-12 text-center text-tracking-tight">
          Por Que Confiar na EXA?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {confianca.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <ExaCard 
                key={index} 
                variant="dark" 
                className="text-center border-gray-800"
                hoverable={!isMobile}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-exa-yellow/10 flex items-center justify-center">
                  <IconComponent className="w-7 h-7 md:w-8 md:h-8 text-exa-yellow" />
                </div>
                <h3 className="text-responsive-h4 text-white mb-3 font-montserrat">
                  {item.title}
                </h3>
                <p className="text-responsive-body text-gray-300 font-inter leading-relaxed">
                  {item.description}
                </p>
              </ExaCard>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};

export default ConfiancaSection;
