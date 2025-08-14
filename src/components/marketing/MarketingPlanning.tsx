
import React from 'react';
import { Search } from 'lucide-react';

const MarketingPlanning: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-indexa-mint to-indexa-purple p-4 rounded-full mr-6 shadow-2xl shadow-indexa-mint/30">
              <Search className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Tudo começa com <span className="bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">planejamento</span>
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20 max-w-4xl mx-auto">
            <p className="text-xl text-white/90 leading-relaxed">
              Reunimos nossa equipe de posicionamento, linguagem e estratégia para entender a fundo sua empresa, seus valores, seus diferenciais e seus objetivos. Nessa imersão criativa e analítica, desenhamos um plano robusto e sob medida que direciona toda a campanha.
            </p>
          </div>
          <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-xl p-6 border border-indexa-mint/30 inline-block">
            <p className="text-2xl text-indexa-mint font-bold">
              Essa é a base de toda campanha de verdade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingPlanning;
