import React from 'react';
import ExaSection from '../base/ExaSection';
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
    <ExaSection background="transparent" className="py-16 md:py-24 bg-[#F8F8F8]">
      <div 
        ref={ref}
        className={`transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-[#111111] mb-12 text-center font-montserrat">
          Valores e Propósito
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {valores.map((valor, index) => {
            const Icon = valor.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C8102E]/10 mb-6 group-hover:bg-[#C8102E]/20 transition-colors duration-300">
                  <Icon className="w-8 h-8 text-[#C8102E]" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-[#111111] mb-4 font-montserrat">
                  {valor.title}
                </h3>
                
                <p className="text-base text-[#555555] font-inter leading-relaxed">
                  {valor.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </ExaSection>
  );
};

export default ValoresSection;
