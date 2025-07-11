import React from 'react';
import { Lightbulb, Gift } from 'lucide-react';

const AIContentSection: React.FC = () => {
  const aiApplications = [
    "Geração de ideias de posts e tendências",
    "Otimização de copywriting para engajamento",
    "Análise de performance e insights",
    "Criação de legendas personalizadas",
    "Hashtags estratégicas por nicho",
    "Cronograma de posts inteligente"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            IA aplicada ao <span className="text-[#00B377]">Social Media</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
            Utilizamos inteligência artificial para potencializar seus resultados nas redes sociais
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-8">Como usamos IA:</h3>
            <div className="space-y-4">
              {aiApplications.map((application, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Lightbulb className="h-6 w-6 text-[#00FFAB] mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{application}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#00FFAB] to-[#00B377] text-white p-8 rounded-xl">
            <Gift className="h-12 w-12 mb-4" />
            <h3 className="text-2xl font-bold mb-4">Manual Gratuito</h3>
            <p className="text-lg mb-6">
              "50 Ideias de Posts que Convertem - Powered by AI"
            </p>
            <p className="opacity-90">
              Baixe nosso guia exclusivo com prompts de IA para criar conteúdo de alta performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIContentSection;