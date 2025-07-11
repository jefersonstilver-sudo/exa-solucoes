import React from 'react';
import { Lightbulb, Target, Palette, Camera, Share2, BarChart3 } from 'lucide-react';

const ContentProcess: React.FC = () => {
  const processSteps = [
    {
      number: 1,
      title: "Estratégia",
      description: "Definimos objetivos, público e tom de voz",
      icon: Lightbulb
    },
    {
      number: 2,
      title: "Planejamento",
      description: "Criamos calendário editorial estratégico",
      icon: Target
    },
    {
      number: 3,
      title: "Design",
      description: "Desenvolvemos identidade visual única",
      icon: Palette
    },
    {
      number: 4,
      title: "Produção",
      description: "Criamos conteúdo foto/vídeo profissional",
      icon: Camera
    },
    {
      number: 5,
      title: "Publicação",
      description: "Gerenciamos posts em horários estratégicos",
      icon: Share2
    },
    {
      number: 6,
      title: "Análise",
      description: "Monitoramos resultados e otimizamos",
      icon: BarChart3
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Nosso Processo de <span className="text-[#00B377]">Criação</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            6 etapas estratégicas para criar conteúdo que engaja e converte
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {processSteps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#00FFAB] to-[#00B377] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>
                <IconComponent className="h-8 w-8 text-[#00B377] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContentProcess;