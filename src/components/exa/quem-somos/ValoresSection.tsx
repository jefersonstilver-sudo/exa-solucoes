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
    <ExaSection background="transparent" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Coluna Esquerda: Título */}
          <div className="md:col-span-4">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111] font-montserrat">
              Valores e Propósito
            </h2>
          </div>

          {/* Coluna Direita: Conteúdo */}
          <div className="md:col-span-8 space-y-8 text-base md:text-lg text-[#555555] font-inter leading-[1.8]">
            {valores.map((valor, index) => (
              <div key={index}>
                <h3 className="text-[#111111] font-bold mb-2 font-montserrat">
                  {valor.title}
                </h3>
                <p>
                  {valor.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default ValoresSection;
