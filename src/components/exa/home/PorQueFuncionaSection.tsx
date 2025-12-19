import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Eye, Calendar, Users } from 'lucide-react';

const reasons = [
  {
    icon: Eye,
    title: 'Atenção Genuína',
    description: 'No elevador, o público observa o conteúdo sem distrações. São 40 interações por semana em média.',
  },
  {
    icon: Calendar,
    title: 'Presença Diária',
    description: 'Cada morador vê a tela todos os dias, gerando 245 exibições diárias por vídeo.',
  },
  {
    icon: Users,
    title: 'Audiência Premium',
    description: 'Público qualificado em prédios residenciais e comerciais de alto padrão.',
  },
];

const PorQueFuncionaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="gradient">
      <div 
        ref={ref}
        className={`space-y-6 md:space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-2">
          <h2 className="font-montserrat font-extrabold text-2xl md:text-4xl lg:text-5xl text-[#9C1E1E]">
            Por Que Funciona?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {reasons.map((reason, index) => (
            <ExaCard 
              key={index} 
              variant="light"
              className="text-center p-4 md:p-6"
            >
              <reason.icon className="w-5 h-5 md:w-10 md:h-10 lg:w-12 lg:h-12 text-[#9C1E1E] mx-auto mb-2 md:mb-6" />
              <h3 className="font-montserrat font-semibold text-base md:text-xl lg:text-2xl text-exa-black mb-2 md:mb-3">
                {reason.title}
              </h3>
              <p className="font-poppins text-gray-600 text-xs md:text-sm lg:text-lg">
                {reason.description}
              </p>
            </ExaCard>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default PorQueFuncionaSection;
