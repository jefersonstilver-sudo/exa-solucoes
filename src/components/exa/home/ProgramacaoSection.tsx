import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Sunrise, Sun, Moon, Settings, Target, Wifi } from 'lucide-react';

const timeBlocks = [
  { icon: Sunrise, time: 'Manhã', content: 'Cafés, padarias e serviços', color: 'from-yellow-400 to-orange-400' },
  { icon: Sun, time: 'Tarde', content: 'Imobiliárias e academias', color: 'from-orange-400 to-red-400' },
  { icon: Moon, time: 'Noite', content: 'Deliverys e restaurantes', color: 'from-purple-600 to-blue-600' },
];

const benefits = [
  { icon: Settings, title: 'Controle Total', description: 'Painel online intuitivo' },
  { icon: Target, title: 'Precisão Estratégica', description: 'Comunicação adaptada à rotina' },
  { icon: Wifi, title: 'Autonomia', description: 'Ajustes em tempo real' },
];

const ProgramacaoSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="gradient" id="programacao">
      <div 
        ref={ref}
        className={`space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="font-montserrat font-extrabold text-2xl md:text-4xl lg:text-5xl text-exa-purple">
            Programação Inteligente
          </h2>
          <p className="font-poppins text-sm md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            O conteúdo certo, na hora certa. Segmente por horários, dias e público.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          {timeBlocks.map((block, index) => (
            <ExaCard key={index} variant="light" className="text-center p-3 md:p-6">
              <div className={`bg-gradient-to-r ${block.color} rounded-full w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center mx-auto mb-2 md:mb-4`}>
                <block.icon className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h3 className="font-montserrat font-semibold text-sm md:text-xl lg:text-2xl text-exa-black mb-1 md:mb-2">
                {block.time}
              </h3>
              <p className="font-poppins text-xs md:text-sm lg:text-base text-gray-600">
                {block.content}
              </p>
            </ExaCard>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mt-6 md:mt-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4 text-center md:text-left">
              <benefit.icon className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-exa-purple flex-shrink-0" />
              <div>
                <h4 className="font-montserrat font-semibold text-xs md:text-base lg:text-lg text-exa-black mb-0.5 md:mb-1">
                  {benefit.title}
                </h4>
                <p className="font-poppins text-[10px] md:text-sm lg:text-base text-gray-600">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default ProgramacaoSection;
