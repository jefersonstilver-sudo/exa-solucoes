import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Layers, Zap, Sparkles } from 'lucide-react';

const pillars = [
  { icon: Layers, title: 'Integração Arquitetônica', description: 'Telas modernas que se tornam parte do espaço' },
  { icon: Zap, title: 'Impacto Controlado', description: 'Brilho calibrado, transições suaves' },
  { icon: Sparkles, title: 'Experiência Visual', description: 'Elevadores transformados em vitrines elegantes' },
];

const DesignExperienciaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="light" id="design">
      <div 
        ref={ref}
        className={`space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-4">
          <h2 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-exa-purple">
            Design & Experiência Visual
          </h2>
          <p className="font-poppins text-xl text-gray-600 max-w-3xl mx-auto">
            Estética que comunica. Design que valoriza o conteúdo e respeita o ambiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {pillars.map((pillar, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="bg-gradient-to-br from-exa-purple to-exa-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                <pillar.icon className="w-10 h-10 text-exa-yellow" strokeWidth={2} />
              </div>
              <h3 className="font-montserrat font-semibold text-lg text-exa-black">
                {pillar.title}
              </h3>
              <p className="font-poppins text-gray-600">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-exa-purple/10 to-exa-blue/10 rounded-3xl p-8 text-center">
          <p className="font-poppins text-lg text-gray-700 italic">
            "Cada tela EXA é pensada para harmonizar com o ambiente, transformando momentos de espera em experiências visuais memoráveis."
          </p>
        </div>
      </div>
    </ExaSection>
  );
};

export default DesignExperienciaSection;
