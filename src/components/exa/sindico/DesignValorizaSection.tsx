import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const DesignValorizaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="light" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo */}
          <div className="space-y-6">
            <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple">
              Elegância e integração visual.
            </h2>
            <p className="font-poppins text-lg text-gray-700 leading-relaxed">
              As telas EXA são projetadas para se integrar de forma harmônica ao elevador.
              O brilho é calibrado, os contrastes são equilibrados e o design se adapta à 
              estética de cada prédio.
            </p>
            <p className="font-poppins text-lg text-gray-700 leading-relaxed">
              Cada instalação é pensada para valorizar o ambiente, transformando o elevador 
              em um espaço moderno e sofisticado que impressiona moradores e visitantes.
            </p>
          </div>
          
          {/* Imagem */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="/placeholder.svg" 
              alt="Render de cabine de elevador com tela EXA"
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default DesignValorizaSection;
