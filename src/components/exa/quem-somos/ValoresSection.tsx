import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
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
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="gradient" className="py-10 md:py-16 lg:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-xl md:text-2xl lg:text-4xl font-bold text-[#111111] font-montserrat mb-6 md:mb-12 text-center">
          Valores e Propósito
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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
                className="text-center hover:scale-105 transition-transform duration-300 p-4 md:p-6"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-[#111111] mb-2 md:mb-3 font-montserrat">
                  {valor.title}
                </h3>
                <p className="text-xs md:text-sm lg:text-base text-[#555555] font-inter leading-relaxed">
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
