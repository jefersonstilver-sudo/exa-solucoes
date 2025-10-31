import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Smartphone, Star, Lock, Zap, MessageSquare, Leaf } from 'lucide-react';

const BeneficiosCondominioSection = () => {
  const { ref, isVisible } = useScrollReveal();

  const benefits = [
    {
      icon: Smartphone,
      title: 'Centralização Total',
      description: 'Todos os comunicados em um único painel.'
    },
    {
      icon: Star,
      title: 'Valorização Imobiliária',
      description: 'Modernização imediata do elevador.'
    },
    {
      icon: Lock,
      title: 'Segurança e Controle',
      description: 'Tudo é gerenciado pelo WhatsApp sem precisar baixar app.'
    },
    {
      icon: Zap,
      title: 'Sem Custo de Instalação',
      description: 'A EXA assume todos os custos técnicos e de manutenção.'
    },
    {
      icon: MessageSquare,
      title: 'Comunicação Eficiente',
      description: 'Mensagens sempre vistas, nunca ignoradas.'
    },
    {
      icon: Leaf,
      title: 'Sustentabilidade',
      description: 'Fim dos papéis, impressões e avisos físicos.'
    }
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
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-[#9C1E1E] mb-4">
            Por que os síndicos escolhem a EXA.
          </h2>
        </div>
        
        {/* Grid de benefícios */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <ExaCard 
              key={index} 
              variant="light"
              className="hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col items-start space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#9C1E1E] to-[#180A0A] rounded-2xl flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-montserrat font-semibold text-2xl text-exa-black mb-2">
                    {benefit.title}
                  </h3>
                  <p className="font-poppins text-gray-600 text-lg">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </ExaCard>
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

export default BeneficiosCondominioSection;
