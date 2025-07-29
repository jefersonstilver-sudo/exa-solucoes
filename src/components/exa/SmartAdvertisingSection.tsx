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
    <section className="relative py-20 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-6 py-3 mb-8">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-400 font-semibold uppercase tracking-wider text-sm">IA & Analytics</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            <span className="text-white block mb-4">Por que nossa publicidade é</span>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              Inteligente?
            </span>
          </h2>
          
          <div className="max-w-5xl mx-auto">
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed mb-8">
              Combinamos <span className="text-cyan-400 font-semibold">tecnologia de ponta</span> com 
              <span className="text-blue-400 font-semibold"> análise de dados</span> para criar campanhas que 
              <span className="text-purple-400 font-semibold"> se adaptam e evoluem em tempo real</span>.
            </p>
            
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-slate-600/50 rounded-2xl p-6">
              <p className="text-lg text-blue-200">
                🚀 <span className="font-bold">Resultado:</span> Campanhas que aprendem, se otimizam e entregam ROI superior automaticamente
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {smartFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group relative"
              >
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-600/40 rounded-2xl p-6 text-center transition-all duration-500 hover:border-cyan-500/50 hover:scale-105 hover:-translate-y-2">
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
                  
                  {/* Animated glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:via-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all duration-500"></div>
                  
                  <div className="relative">
                    {/* Premium Icon Container */}
                    <div className="relative mx-auto mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <IconComponent className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">{feature.description}</p>
                    
                    {/* Hover indicator */}
                    <div className="w-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mt-4 group-hover:w-16 transition-all duration-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Results Section */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-slate-600/30 rounded-3xl p-8 sm:p-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-2 mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-400 font-semibold uppercase tracking-wider text-sm">Resultados Comprovados</span>
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Performance que Impressiona</h3>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Dados reais de campanhas ativas demonstram a superioridade da inteligência artificial aplicada à publicidade
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center">
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/40 rounded-2xl p-6 transition-all duration-300 group-hover:border-cyan-500/50 group-hover:scale-105">
                <div className="text-5xl sm:text-6xl font-black mb-3">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">+300%</span>
                </div>
                <div className="text-xl font-bold text-white mb-2">Lembrança de Marca</div>
                <div className="text-gray-400">Aumento médio comprovado</div>
                <div className="w-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mt-4 group-hover:w-20 transition-all duration-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="group text-center">
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/40 rounded-2xl p-6 transition-all duration-300 group-hover:border-blue-500/50 group-hover:scale-105">
                <div className="text-5xl sm:text-6xl font-black mb-3">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">+150%</span>
                </div>
                <div className="text-xl font-bold text-white mb-2">Engajamento</div>
                <div className="text-gray-400">Melhora na interação</div>
                <div className="w-0 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-4 group-hover:w-20 transition-all duration-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="group text-center">
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/40 rounded-2xl p-6 transition-all duration-300 group-hover:border-purple-500/50 group-hover:scale-105">
                <div className="text-5xl sm:text-6xl font-black mb-3">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">+250%</span>
                </div>
                <div className="text-xl font-bold text-white mb-2">ROI</div>
                <div className="text-gray-400">vs publicidade tradicional</div>
                <div className="w-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500 mx-auto mt-4 group-hover:w-20 transition-all duration-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Additional CTA */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl px-8 py-4">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold text-white">Resultados em tempo real • Otimização contínua • ROI garantido</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SmartAdvertisingSection;