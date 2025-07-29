import React from 'react';
import { Brain, Clock, Users, Smartphone } from 'lucide-react';

const SmartAdvertisingSection: React.FC = () => {
  const smartFeatures = [
    {
      icon: Brain,
      title: "IA Programática",
      description: "Algoritmos inteligentes otimizam automaticamente sua campanha para máximo ROI"
    },
    {
      icon: Clock,
      title: "Timing Perfeito",
      description: "Veiculação nos horários de maior tráfego do seu público-alvo"
    },
    {
      icon: Users,
      title: "Segmentação Avançada",
      description: "Direcionamento por dados demográficos, comportamentais e geográficos"
    },
    {
      icon: Smartphone,
      title: "Integração Digital",
      description: "QR Codes dinâmicos conectam painéis às suas plataformas digitais"
    }
  ];

  return (
    <section className="py-20 bg-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Por que nossa publicidade é <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">inteligente</span>?
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Combinamos tecnologia de ponta com análise de dados para criar campanhas que se adaptam e evoluem em tempo real.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {smartFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="text-center group hover:transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-cyan-500/25">
                  <IconComponent className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Resultado Comprovado</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-cyan-400 mb-2">+300%</div>
                <div className="text-gray-300">Aumento médio em lembrança de marca</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400 mb-2">+150%</div>
                <div className="text-gray-300">Melhora no engajamento</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400 mb-2">+250%</div>
                <div className="text-gray-300">ROI comparado à publicidade tradicional</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartAdvertisingSection;