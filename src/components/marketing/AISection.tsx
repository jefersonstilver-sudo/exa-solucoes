
import React from 'react';
import { Gift, Lightbulb } from 'lucide-react';

const AISection: React.FC = () => {
  const aiApplications = [
    "Análise de linguagem e tom de voz ideal",
    "Brainstorm criativo com IA generativa",
    "Produção acelerada de rascunhos, scripts e headlines",
    "Otimização de anúncios com machine learning"
  ];

  return (
    <section className="py-20 bg-gradient-to-r from-gray-50 to-[#00FFAB]/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            🤖 IA + MARKETING: <span className="text-[#00FFAB]">A NOVA ERA É AGORA</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8">
            Utilizamos inteligência artificial para potencializar todas as fases da campanha:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {aiApplications.map((application, index) => (
            <div key={index} className="flex items-center bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <Lightbulb className="h-6 w-6 text-[#00FFAB] mr-4 flex-shrink-0" />
              <span className="text-gray-900">{application}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#00FFAB]/10 border border-[#00FFAB]/30 rounded-2xl p-8 text-center">
          <Gift className="h-12 w-12 text-[#00FFAB] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#00FFAB] mb-4">Manual Gratuito Exclusivo</h3>
          <p className="text-lg text-gray-900 mb-2">
            <strong>"Como usar IA e Apps para vender mais, com menos esforço"</strong>
          </p>
          <p className="text-gray-600">
            Entregue ao agendar seu café conosco - especialmente para empresários de Foz do Iguaçu.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AISection;
