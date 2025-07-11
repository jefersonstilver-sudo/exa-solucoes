import React from 'react';
import { Check, X } from 'lucide-react';

const ExaAdvantagesSection: React.FC = () => {
  const comparison = [
    {
      feature: "Qualidade de imagem",
      traditional: "Baixa resolução, desbotamento",
      exa: "4K ultra HD, cores vibrantes",
      advantage: true
    },
    {
      feature: "Flexibilidade de conteúdo",
      traditional: "Impressão fixa por semanas",
      exa: "Atualização instantânea",
      advantage: true
    },
    {
      feature: "Custo de troca",
      traditional: "Alto (nova impressão)",
      exa: "Zero (digital)",
      advantage: true
    },
    {
      feature: "Mensuração de resultados",
      traditional: "Estimativas imprecisas",
      exa: "Analytics detalhados",
      advantage: true
    },
    {
      feature: "Segmentação de público",
      traditional: "Impossível",
      exa: "Horários e perfis específicos",
      advantage: true
    },
    {
      feature: "Impacto ambiental",
      traditional: "Papel, tintas, descarte",
      exa: "100% digital, sustentável",
      advantage: true
    }
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            EXA vs <span className="text-red-400">Publicidade Tradicional</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Veja por que a publicidade inteligente supera os métodos tradicionais em todos os aspectos.
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-700/50 p-4 font-bold text-lg">
            <div className="text-center">Aspecto</div>
            <div className="text-center text-red-400">Publicidade Tradicional</div>
            <div className="text-center text-green-400">EXA</div>
          </div>

          {comparison.map((item, index) => (
            <div key={index} className="grid grid-cols-3 p-4 border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
              <div className="font-semibold">{item.feature}</div>
              <div className="text-center text-red-300 flex items-center justify-center">
                <X className="h-5 w-5 mr-2 text-red-400" />
                {item.traditional}
              </div>
              <div className="text-center text-green-300 flex items-center justify-center">
                <Check className="h-5 w-5 mr-2 text-green-400" />
                {item.exa}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center bg-slate-800/30 p-6 rounded-xl border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400 mb-2">85%</div>
            <div className="text-gray-300">Mais eficaz que outdoors tradicionais</div>
          </div>
          <div className="text-center bg-slate-800/30 p-6 rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-2">60%</div>
            <div className="text-gray-300">Redução no custo por impressão</div>
          </div>
          <div className="text-center bg-slate-800/30 p-6 rounded-xl border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-gray-300">Controle sobre sua campanha</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;