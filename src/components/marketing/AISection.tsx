
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
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
            IA + MARKETING: <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">A NOVA ERA É AGORA</span>
          </h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <p className="text-xl text-white/90 leading-relaxed">
              Utilizamos inteligência artificial para potencializar todas as fases da campanha:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {aiApplications.map((application, index) => (
            <div key={index} className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-indexa-mint to-indexa-purple p-2 rounded-full mr-4 flex-shrink-0 group-hover:shadow-lg group-hover:shadow-indexa-mint/50 transition-all duration-300">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-medium">{application}</span>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm border border-indexa-mint/30 rounded-2xl p-8 text-center">
          <div className="bg-gradient-to-br from-indexa-mint to-indexa-purple p-4 rounded-full w-fit mx-auto mb-6 shadow-2xl shadow-indexa-mint/30">
            <Gift className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-indexa-mint mb-4">Manual Gratuito Exclusivo</h3>
          <p className="text-lg text-white mb-4">
            <strong>"Como usar IA e Apps para vender mais, com menos esforço"</strong>
          </p>
          <p className="text-white/80">
            Entregue ao agendar sua reunião estratégica - especialmente para empresários de Foz do Iguaçu.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AISection;
