import React from 'react';
import { BarChart3, Target, Users, Zap } from 'lucide-react';

const differentiators = [
  {
    icon: Target,
    title: "Planejamento Personalizado",
    description: "Cada estratégia é única, desenvolvida especificamente para seu negócio e público-alvo.",
    highlight: "100% personalizado"
  },
  {
    icon: BarChart3,
    title: "Relatórios Analíticos",
    description: "Análises completas de performance com insights acionáveis para otimizar resultados.",
    highlight: "Dados reais"
  },
  {
    icon: Users,
    title: "Equipe Local Especializada",
    description: "Profissionais que conhecem Foz do Iguaçu e região, entendendo as particularidades locais.",
    highlight: "Conhecimento local"
  },
  {
    icon: Zap,
    title: "Implementação Rápida",
    description: "Começamos a trabalhar imediatamente, sem burocracias ou delays desnecessários.",
    highlight: "Resultados em 30 dias"
  }
];

const LinkaeDifferentiators: React.FC = () => {
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
            Por Que Escolher a Linkaê?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Não somos apenas mais uma agência. <span className="text-[#FF8A80] font-semibold">Somos especialistas locais</span> com 
            <span className="text-[#F57C00] font-semibold"> metodologia comprovada</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {differentiators.map((diff, index) => {
            const IconComponent = diff.icon;
            return (
              <div 
                key={index} 
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-white mr-4 flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-[#FF8A80]" />
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mr-3">
                        {diff.title}
                      </h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F57C00]/10 text-[#F57C00]">
                        {diff.highlight}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed">
                      {diff.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LinkaeDifferentiators;