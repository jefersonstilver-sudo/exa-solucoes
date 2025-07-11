import React from 'react';
import { Zap, Target, BarChart3 } from 'lucide-react';

const AboutExaSection: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: "Tecnologia Avançada",
      description: "Painéis digitais de última geração com qualidade 4K e alta durabilidade"
    },
    {
      icon: Target,
      title: "Publicidade Direcionada", 
      description: "Segmentação inteligente por horário, perfil demográfico e comportamento"
    },
    {
      icon: BarChart3,
      title: "Resultados Mensuráveis",
      description: "Analytics em tempo real com métricas detalhadas de impacto e engajamento"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            O futuro da <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">publicidade</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            EXA revoluciona a publicidade exterior com painéis digitais inteligentes que se adaptam ao seu público-alvo, maximizando o impacto da sua mensagem.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Publicidade Inteligente. Resultados Exponenciais.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutExaSection;