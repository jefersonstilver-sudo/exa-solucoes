import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { Building, TrendingUp, MapPin } from 'lucide-react';

const ExpansaoImpactoSection = () => {
  const { ref, isVisible } = useScrollReveal();
  
  const count50 = useCounterAnimation(50, 2000, isVisible);
  const count100 = useCounterAnimation(100, 2000, isVisible);

  const milestones = [
    {
      icon: Building,
      value: count50,
      label: 'prédios conectados',
      year: 'Hoje'
    },
    {
      icon: TrendingUp,
      value: count100,
      label: 'prédios conectados',
      year: '2025'
    },
    {
      icon: MapPin,
      value: '3',
      label: 'países alcançados',
      year: '2026'
    }
  ];

  return (
    <ExaSection background="transparent" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Título */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple mb-6">
            Parte de uma cidade que cresce.
          </h2>
          <p className="font-poppins text-lg text-gray-700 leading-relaxed">
            A EXA nasceu em Foz do Iguaçu e cresce em ritmo acelerado, acompanhando 
            o movimento de verticalização da cidade. Cada novo prédio conectado amplia 
            o alcance e fortalece a comunidade.
          </p>
        </div>
        
        {/* Timeline de expansão */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {milestones.map((milestone, index) => (
            <div 
              key={index}
              className="relative bg-gradient-to-br from-exa-purple/10 to-exa-blue/10 rounded-3xl p-8 text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-exa-purple to-exa-blue rounded-2xl flex items-center justify-center">
                  <milestone.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-5xl font-montserrat font-extrabold text-exa-purple mb-2">
                {milestone.value}
              </div>
              
              <div className="font-poppins text-gray-700 mb-2">
                {milestone.label}
              </div>
              
              <div className="inline-block px-4 py-1 bg-exa-yellow rounded-full text-sm font-montserrat font-semibold text-exa-black">
                {milestone.year}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default ExpansaoImpactoSection;
