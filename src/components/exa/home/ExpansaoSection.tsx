import React from 'react';
import ExaSection from '../base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { MapPin, TrendingUp } from 'lucide-react';

const timeline = [
  { year: '2025', milestone: '100 prédios conectados em Foz do Iguaçu' },
  { year: '2026', milestone: 'Expansão para PR e Tríplice Fronteira' },
];

const ExpansaoSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="dark" id="expansao">
      <div 
        ref={ref}
        className={`space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="font-montserrat font-extrabold text-xl md:text-3xl lg:text-4xl xl:text-5xl text-white">
            Expansão <span className="text-exa-yellow">Estratégica</span>
          </h2>
          <p className="font-poppins text-sm md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto">
            Presença estratégica e crescimento urbano planejado.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
          {timeline.map((item, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-xl md:rounded-2xl lg:rounded-3xl p-4 md:p-6 lg:p-8 text-center space-y-2 md:space-y-4 hover:scale-105 transition-transform duration-300 shadow-lg"
            >
              {index === 0 ? (
                <MapPin className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-exa-yellow mx-auto" />
              ) : (
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-exa-yellow mx-auto" />
              )}
              <div className="font-montserrat font-extrabold text-3xl md:text-5xl lg:text-6xl text-exa-yellow">
                {item.year}
              </div>
              <p className="font-poppins text-xs md:text-base lg:text-lg text-white">
                {item.milestone}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:mt-12">
          <div className="inline-flex items-center space-x-2 bg-exa-yellow/20 px-4 md:px-6 py-2 md:py-3 rounded-full">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-exa-yellow" />
            <span className="font-poppins text-sm md:text-base text-white">
              Atualmente em <span className="font-semibold text-exa-yellow">Foz do Iguaçu, PR</span>
            </span>
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default ExpansaoSection;
