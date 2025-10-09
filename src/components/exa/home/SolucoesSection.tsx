import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Sparkles, Cloud, Clock, BarChart } from 'lucide-react';

const solutions = [
  {
    icon: Sparkles,
    title: 'Publicidade Inteligente',
    description: 'Anúncios em elevadores com segmentação por horário e prédio',
  },
  {
    icon: Cloud,
    title: 'Conteúdos Úteis',
    description: 'Câmbio, clima, trânsito, avisos e notícias locais',
  },
  {
    icon: Clock,
    title: 'Programação por Horário',
    description: 'Vídeos alternam conforme horário e público',
  },
  {
    icon: BarChart,
    title: 'Métricas em Tempo Real',
    description: 'Dashboard completo com logs de exibição',
  },
];

const SolucoesSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="light" id="solucoes">
      <div 
        ref={ref}
        className={`space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-4">
          <h2 className="font-montserrat font-extrabold text-4xl lg:text-5xl text-exa-purple">
            Soluções EXA
          </h2>
          <p className="font-poppins text-xl text-gray-600 max-w-3xl mx-auto">
            Cada tela EXA é um painel inteligente e programável. A publicidade deixa de ser fixa e passa a ser dinâmica e viva.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {solutions.map((solution, index) => (
            <ExaCard 
              key={index} 
              variant="light"
              className={`transition-all duration-500 delay-${index * 100}`}
            >
              <solution.icon className="w-12 h-12 text-exa-purple mb-4" />
              <h3 className="font-montserrat font-semibold text-xl text-exa-black mb-2">
                {solution.title}
              </h3>
              <p className="font-poppins text-gray-600">
                {solution.description}
              </p>
            </ExaCard>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default SolucoesSection;
