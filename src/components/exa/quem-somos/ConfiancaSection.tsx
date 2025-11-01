import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
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
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="dark" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-montserrat mb-12 text-center">
          Por Que Confiar na EXA?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {confianca.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <ExaCard 
                key={index} 
                variant="dark" 
                className="text-center hover:scale-105 transition-transform duration-300 border-gray-800"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-exa-yellow/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-exa-yellow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-montserrat">
                  {item.title}
                </h3>
                <p className="text-gray-300 font-inter leading-relaxed">
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
