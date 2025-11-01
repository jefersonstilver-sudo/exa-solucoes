import React from 'react';
import ExaCTA from '@/components/exa/base/ExaCTA';
import CondominiosTicker from './CondominiosTicker';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SindicoHeroSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { data: config } = useVideoConfig();

  const defaultCondominios = [
    'Edifício Aurora',
    'Condomínio Bela Vista',
    'Residencial Panorama',
    'Edifício Excellence',
    'Condomínio Premium'
  ];

  return (
    <section 
      ref={ref}
      className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-exa-black via-[#9C1E1E]/20 to-exa-black pt-20 md:pt-24 pb-24 md:pb-16"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-exa-black/50 to-exa-black z-0" />
      
      {/* Ticker de condomínios no topo - sempre visível */}
      <div className="relative z-[60] mb-8 md:mb-12">
        <CondominiosTicker />
      </div>
      
      {/* Conteúdo centralizado */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div 
          className={`relative z-[50] container mx-auto px-4 md:px-[10%] max-w-[1440px] text-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h1 className="font-montserrat font-extrabold text-4xl md:text-5xl lg:text-7xl text-white mb-6">
            Transforme a comunicação<br />
            <span className="text-[#D72638]">
              do seu prédio
            </span>
          </h1>
          
          <p className="font-poppins text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 md:mb-12">
            A EXA leva informação, estética e tecnologia para dentro do elevador — 
            o espaço onde todos passam, todos os dias.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ExaCTA variant="primary" size="lg" to="/contato">
              Quero ter a EXA no meu prédio
            </ExaCTA>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SindicoHeroSection;
