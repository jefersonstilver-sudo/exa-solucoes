import React from 'react';
import { Brain, BarChart3, Target, Lightbulb, Users, Zap } from 'lucide-react';

const LinkaeDifferentiators: React.FC = () => {
  const differentiators = [
    {
      icon: Brain,
      title: "Planejamento Personalizado",
      description: "Nunca mais fique sem saber o que postar - calendário editorial completo para 12 meses"
    },
    {
      icon: BarChart3,
      title: "Relatórios Analíticos",
      description: "Métricas claras e insights acionáveis para medir cada conexão e conversão"
    },
    {
      icon: Target,
      title: "Metodologia T.A.C.C.O.H.",
      description: "Nossa estratégia exclusiva de 6 pilares que transforma posts em vendas"
    }
  ];

  return (
    <section className="h-[60vh] flex items-center justify-center bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Por Que Somos <span className="text-[#F57C00]">Diferentes</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Não somos apenas mais uma agência. Resolvemos definitivamente o problema de "não saber o que postar"
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((diff, index) => {
            const IconComponent = diff.icon;
            return (
              <div
                key={index}
                className="text-center p-8 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-[#FF8A80] rounded-xl flex items-center justify-center mb-6 mx-auto">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">{diff.title}</h3>
                <p className="text-gray-600 leading-relaxed">{diff.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#FF8A80]/10 to-[#F57C00]/10 border-2 border-[#FF8A80]/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Resultado Garantido em 30 Dias
            </h3>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Você nunca mais vai ficar sem saber o que postar. Garantimos um planejamento completo que gera conexões reais e vendas mensuráveis.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeDifferentiators;