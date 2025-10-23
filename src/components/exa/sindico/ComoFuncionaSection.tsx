import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import TimelineStep from './TimelineStep';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Clipboard, Wrench, Monitor, RefreshCw } from 'lucide-react';

const ComoFuncionaSection = () => {
  const { ref, isVisible } = useScrollReveal();

  const steps = [
    {
      number: 1,
      icon: Clipboard,
      title: 'Candidatura do Condomínio',
      description: 'Cadastre seu condomínio com mínimo de 24 unidades em um único bloco. Após análise, nossa equipe aprova e agenda a instalação.'
    },
    {
      number: 2,
      icon: Wrench,
      title: 'Instalação da Tela',
      description: 'Equipe técnica instala o equipamento sem impacto estético.'
    },
    {
      number: 3,
      icon: Monitor,
      title: 'Acesso ao Painel',
      description: 'Disponibilizamos um número de WhatsApp com IA para o síndico gerar e alterar avisos facilmente.'
    },
    {
      number: 4,
      icon: RefreshCw,
      title: 'Atualização Automática',
      description: 'Os conteúdos sobem instantaneamente para as telas.'
    }
  ];

  return (
    <ExaSection background="gradient" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Título */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-exa-purple mb-4">
            Simples, automático e inteligente.
          </h2>
        </div>
        
        {/* Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <TimelineStep
              key={index}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default ComoFuncionaSection;
