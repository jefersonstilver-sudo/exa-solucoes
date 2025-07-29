import React, { useState } from 'react';
import { Zap, Target, BarChart3, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

const AboutExaSection: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: Zap,
      title: "Tecnologia Avançada",
      description: "Painéis digitais de última geração com qualidade 4K e alta durabilidade",
      details: ["Resolução 4K Ultra HD", "Durabilidade 10+ anos", "Conectividade 5G"],
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Target,
      title: "Publicidade Direcionada", 
      description: "Segmentação inteligente por horário, perfil demográfico e comportamento",
      details: ["Segmentação por IA", "Horários otimizados", "Público qualificado"],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: BarChart3,
      title: "Resultados Mensuráveis",
      description: "Analytics em tempo real com métricas detalhadas de impacto e engajamento",
      details: ["Dashboard em tempo real", "ROI detalhado", "Relatórios customizados"],
      color: "from-emerald-500 to-teal-600"
    }
  ];

  const stats = [
    { value: "85%", label: "Mais Efetivo", description: "que publicidade tradicional" },
    { value: "60%", label: "Redução de Custos", description: "comparado ao outdoor" },
    { value: "100%", label: "Controle Total", description: "de suas campanhas" }
  ];

  return (
    <section className="relative py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-6 py-2 mb-8">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 font-semibold uppercase tracking-wider text-sm">Revolução Digital</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            <span className="block text-white">Acabou o</span>
            <span className="block bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              Marketing Genérico
            </span>
            <span className="block text-white mt-4">Chegou a</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Precisão EXA
            </span>
          </h2>

          {/* Value Proposition Box */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
              <div className="relative">
                <p className="text-xl sm:text-2xl md:text-3xl font-light text-gray-200 leading-relaxed mb-6">
                  <span className="font-bold text-white">Os painéis EXA permitem anúncios segmentados</span> em prédios estratégicos, 
                  com <span className="text-cyan-400 font-semibold">mensuração de QR codes escaneados</span> e 
                  <span className="text-purple-400 font-semibold"> flexibilidade para múltiplos vídeos por semana</span>.
                </p>
                
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6">
                  <p className="text-lg sm:text-xl text-yellow-200 leading-relaxed">
                    💡 Resolvemos as dores do marketing genérico e impulsionamos conexões que transformam 
                    <span className="text-yellow-300 font-bold block mt-2">✨ visibilidade em vendas para todos os tamanhos de negócios</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isHovered = hoveredCard === index;
            
            return (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={`relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-600/40 rounded-3xl p-8 transition-all duration-500 transform ${
                  isHovered ? 'scale-105 border-white/30' : 'hover:border-slate-500/60'
                }`}>
                  {/* Glassmorphism effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                  
                  {/* Animated background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500`}></div>
                  
                  <div className="relative">
                    {/* Premium Icon */}
                    <div className={`w-20 h-20 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                      isHovered ? 'scale-110 rotate-3' : ''
                    }`}>
                      <IconComponent className="h-10 w-10 text-white" />
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}></div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed mb-6">{feature.description}</p>
                    
                    {/* Feature Details */}
                    <div className="space-y-3">
                      {feature.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-gray-300">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Statistics Section */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-xl border border-slate-600/30 rounded-3xl p-8 sm:p-12 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Números que Comprovam</h3>
            <p className="text-xl text-gray-300">A superioridade da publicidade EXA</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/40 rounded-2xl p-6 transition-all duration-300 group-hover:border-white/30 group-hover:scale-105">
                  <div className="text-5xl sm:text-6xl font-black mb-3">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {stat.value}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white mb-2">{stat.label}</div>
                  <div className="text-gray-400">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-8 py-6">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Publicidade Inteligente. Resultados Exponenciais.
            </span>
            <ArrowRight className="w-8 h-8 text-blue-400 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutExaSection;