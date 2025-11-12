import React from 'react';
import { Link } from 'react-router-dom';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Award, Shield, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const confianca = [
  {
    icon: Award,
    title: 'Validado pelo Secovi Paraná',
    description: 'Modelo de negócio aprovado e apoiado pelo Sindicato da Habitação do Paraná, garantindo ética e transparência.'
  },
  {
    icon: Shield,
    title: 'Tecnologia Própria e Segura',
    description: 'Players inteligentes e sistemas desenvolvidos internamente, assegurando estabilidade, design e proteção de dados.'
  },
  {
    icon: MapPin,
    title: 'Presença Local em Foz do Iguaçu',
    description: 'Empresa sediada em Foz do Iguaçu – PR, com atendimento próximo e comprometido com a região.'
  }
];

const ConfiancaSection = () => {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <ExaSection background="dark" className="py-16 md:py-24">
      <div 
        ref={ref}
        className={`max-w-[1200px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-montserrat mb-12 text-center">
          Por Que Confiar na EXA?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {confianca.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <ExaCard 
                key={index} 
                variant="dark" 
                className="text-center hover:scale-105 transition-transform duration-300 border-gray-800"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-exa-yellow/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-exa-yellow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-montserrat">
                  {item.title}
                </h3>
                <p className="text-gray-300 font-inter leading-relaxed">
                  {item.description}
                </p>
              </ExaCard>
            );
          })}
        </div>

        {/* Mídia Kit Card - Destaque especial */}
        <div className="mt-12">
          <ExaCard 
            variant="dark" 
            className="text-center border-2 border-exa-yellow/30 hover:border-exa-yellow/60 hover:scale-102 transition-all duration-300 bg-gradient-to-br from-gray-900/50 to-black/50"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-exa-yellow to-red-500 flex items-center justify-center animate-pulse">
              <FileText className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 font-montserrat">
              Conheça Nosso Mídia Kit
            </h3>
            <p className="text-gray-300 font-inter leading-relaxed mb-6 max-w-2xl mx-auto">
              Explore nosso portfólio completo, números de alcance, cases de sucesso e diferenciais. 
              Tudo o que você precisa saber sobre a EXA em um só lugar.
            </p>
            <Link to="/midia-kit">
              <Button
                size="lg"
                className="bg-gradient-to-r from-exa-yellow to-red-500 hover:from-exa-yellow/90 hover:to-red-500/90 text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <FileText className="mr-2 h-5 w-5" />
                Acessar Mídia Kit
              </Button>
            </Link>
          </ExaCard>
        </div>
      </div>
    </ExaSection>
  );
};

export default ConfiancaSection;
