import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CredibilidadeSection = () => {
  const { ref, isVisible } = useScrollReveal();

  const parceiros = [
    { name: 'Indexa Mídia', logo: '/placeholder.svg' },
    { name: 'Secovi Paraná', logo: '/placeholder.svg' },
    { name: 'Portal da Cidade', logo: '/placeholder.svg' },
    { name: 'Condomínios Parceiros', logo: '/placeholder.svg' }
  ];

  return (
    <ExaSection background="light" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Título */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple mb-6">
            Um ecossistema sólido e reconhecido.
          </h2>
          <p className="font-poppins text-lg text-gray-700 leading-relaxed">
            A EXA é resultado da parceria entre marcas e instituições que valorizam 
            a inovação e a comunicação urbana.
          </p>
        </div>
        
        {/* Logos dos parceiros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-center justify-items-center max-w-4xl mx-auto">
          {parceiros.map((parceiro, index) => (
            <div 
              key={index}
              className="group relative w-full aspect-video flex items-center justify-center p-6 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300"
            >
              <img 
                src={parceiro.logo}
                alt={parceiro.name}
                className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default CredibilidadeSection;
