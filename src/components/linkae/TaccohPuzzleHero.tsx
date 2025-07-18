
import React, { useState, useEffect } from 'react';
import { Puzzle, Sparkles, TrendingUp, Users, Heart, Zap, ArrowRight, Play, BarChart3, Target, Lightbulb, Trophy } from 'lucide-react';

const TaccohPuzzleHero: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [counters, setCounters] = useState({ brands: 0, engagement: 0, cases: 0, roi: 0 });

  const taccohData = [
    { 
      id: 'T', 
      letter: 'T', 
      title: 'Técnico', 
      subtitle: 'Demonstre expertise através do processo',
      color: 'from-blue-500 via-blue-600 to-indigo-600',
      glowColor: 'shadow-blue-500/30',
      icon: Puzzle,
      description: 'Mostre o processo, gere confiança técnica',
      expandedContent: {
        example: 'Tutorial step-by-step que gera 300% mais engajamento',
        case: 'Salão que mostrou técnica de corte: +250% agendamentos',
        metrics: '+300% engajamento',
        posts: ['Como fazer X', 'Passo a passo', 'Bastidores do processo']
      }
    },
    { 
      id: 'A', 
      letter: 'A', 
      title: 'Autoridade', 
      subtitle: 'Construa credibilidade com prova social',
      color: 'from-yellow-400 via-orange-400 to-orange-500',
      glowColor: 'shadow-orange-500/30',
      icon: Trophy,
      description: 'Conquistas, credibilidade, cases',
      expandedContent: {
        example: 'Certificações + depoimentos = confiança instantânea',
        case: 'Dentista que mostrou casos: +400% conversões',
        metrics: '+400% conversões',
        posts: ['Certificações', 'Depoimentos', 'Prêmios e conquistas']
      }
    },
    { 
      id: 'C1', 
      letter: 'C', 
      title: 'Crescimento', 
      subtitle: 'Ensine para se tornar referência',
      color: 'from-green-400 via-emerald-500 to-emerald-600',
      glowColor: 'shadow-emerald-500/30',
      icon: TrendingUp,
      description: 'Inspire, ensine, viralize',
      expandedContent: {
        example: 'Dicas valiosas que viralizam naturalmente',
        case: 'Coach que ensinou técnicas: 50k seguidores em 3 meses',
        metrics: '+340% alcance',
        posts: ['Dicas valiosas', 'Tutoriais', 'Conteúdo educativo']
      }
    },
    { 
      id: 'C2', 
      letter: 'C', 
      title: 'Conexão', 
      subtitle: 'Humanize sua marca com storytelling',
      color: 'from-pink-400 via-rose-500 to-rose-600',
      glowColor: 'shadow-rose-500/30',
      icon: Heart,
      description: 'Histórias reais, emoção, humanidade',
      expandedContent: {
        example: 'Histórias pessoais que geram identificação',
        case: 'Loja que contou origem: +180% vendas orgânicas',
        metrics: '+180% vendas',
        posts: ['História pessoal', 'Valores da marca', 'Momentos especiais']
      }
    },
    { 
      id: 'O', 
      letter: 'O', 
      title: 'Objeção', 
      subtitle: 'Antecipe e resolva dúvidas dos clientes',
      color: 'from-red-500 via-red-600 to-pink-600',
      glowColor: 'shadow-red-500/30',
      icon: Target,
      description: 'Antecipe e quebra barreiras',
      expandedContent: {
        example: "FAQ's transformados em conteúdo persuasivo",
        case: 'E-commerce que respondeu objeções: +90% conversões',
        metrics: '+90% conversões',
        posts: ['FAQ interativo', 'Mitos vs Verdades', 'Esclarecimentos']
      }
    },
    { 
      id: 'H', 
      letter: 'H', 
      title: 'Hype', 
      subtitle: 'Aproveite trends para viralizar',
      color: 'from-orange-400 via-yellow-500 to-yellow-600',
      glowColor: 'shadow-yellow-500/30',
      icon: Zap,
      description: 'Trends, memes, viral',
      expandedContent: {
        example: 'Adapte memes ao seu nicho estrategicamente',
        case: 'Restaurante que surfou trend: 2M visualizações',
        metrics: '+2M views',
        posts: ['Trends adaptados', 'Memes do nicho', 'Conteúdo viral']
      }
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 300);
    
    // Animação dos contadores
    const targetCounters = { brands: 500, engagement: 340, cases: 150, roi: 280 };
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let step = 0;
    const counterInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounters({
        brands: Math.floor(targetCounters.brands * progress),
        engagement: Math.floor(targetCounters.engagement * progress),
        cases: Math.floor(targetCounters.cases * progress),
        roi: Math.floor(targetCounters.roi * progress)
      });
      
      if (step >= steps) {
        clearInterval(counterInterval);
        setCounters(targetCounters);
      }
    }, stepDuration);
    
    return () => {
      clearTimeout(timer);
      clearInterval(counterInterval);
    };
  }, []);

  const getPositionClasses = (position: string, isExpanded: boolean) => {
    const baseClasses = `absolute transition-all duration-500 ${isExpanded ? 'z-20' : 'z-10'}`;
    const size = isExpanded ? 'w-80 h-80' : 'w-32 h-32 md:w-40 md:h-40';
    
    switch (position) {
      case 'top-left': return `${baseClasses} ${size} top-0 left-0`;
      case 'top-right': return `${baseClasses} ${size} top-0 right-0`;
      case 'middle-left': return `${baseClasses} ${size} top-1/2 left-0 -translate-y-1/2`;
      case 'middle-right': return `${baseClasses} ${size} top-1/2 right-0 -translate-y-1/2`;
      case 'bottom-left': return `${baseClasses} ${size} bottom-0 left-0`;
      case 'bottom-right': return `${baseClasses} ${size} bottom-0 right-0`;
      default: return `${baseClasses} ${size}`;
    }
  };

  const positions = ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'];

  return (
    <section className="relative py-32 md:py-40 overflow-hidden">
      {/* Background Avançado */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        
        {/* Elementos Geométricos Animados */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-indigo-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-green-100/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-100/10 to-pink-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Melhorado */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full border border-blue-200/50 mb-6 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 tracking-wide">MÉTODO EXCLUSIVO</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            <span className="block bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent">
              Não sabe o que postar?
            </span>
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Descubra o T.A.C.C.O.H.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            O método estratégico que <strong className="text-blue-600">grandes marcas</strong> usam para criar 
            conteúdo que <strong className="text-emerald-600">realmente converte</strong>.
          </p>

          {/* Estatísticas Impressionantes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-blue-600 mb-1">{counters.brands}+</div>
              <div className="text-sm text-gray-600">Marcas atendidas</div>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-emerald-600 mb-1">{counters.engagement}%</div>
              <div className="text-sm text-gray-600">Mais engajamento</div>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-orange-600 mb-1">{counters.cases}+</div>
              <div className="text-sm text-gray-600">Cases de sucesso</div>
            </div>
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-purple-600 mb-1">{counters.roi}%</div>
              <div className="text-sm text-gray-600">ROI médio</div>
            </div>
          </div>
        </div>

        {/* Puzzle Interativo Revolucionário */}
        <div className="relative max-w-6xl mx-auto mb-20">
          <div className="relative h-96 md:h-[600px] mx-auto" style={{ width: 'min(800px, 90vw)' }}>
            {taccohData.map((piece, index) => {
              const IconComponent = piece.icon;
              const position = positions[index];
              const isExpanded = expandedCard === piece.id;
              
              return (
                <div key={piece.id} className="relative">
                  <div
                    className={getPositionClasses(position, isExpanded)}
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div 
                      className={`w-full h-full bg-gradient-to-br ${piece.color} rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-2 border-white/30 backdrop-blur-sm cursor-pointer group ${piece.glowColor} ${isExpanded ? 'scale-105' : 'hover:scale-110'} ${animateIn ? 'animate-fade-in' : 'opacity-0'}`}
                      onMouseEnter={() => !isExpanded && setExpandedCard(piece.id)}
                      onMouseLeave={() => setExpandedCard(null)}
                      onClick={() => setExpandedCard(isExpanded ? null : piece.id)}
                    >
                      {!isExpanded ? (
                        // Card Normal
                        <div className="flex flex-col items-center justify-center h-full p-6 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <IconComponent className="h-8 w-8 md:h-12 md:w-12 mb-4 relative z-10" />
                          <span className="text-4xl md:text-5xl font-bold mb-2 relative z-10">{piece.letter}</span>
                          <span className="text-sm md:text-base font-semibold text-center relative z-10">{piece.title}</span>
                          <span className="text-xs md:text-sm text-center opacity-90 mt-1 relative z-10">{piece.subtitle}</span>
                        </div>
                      ) : (
                        // Card Expandido
                        <div className="p-8 text-white h-full overflow-y-auto">
                          <div className="flex items-center gap-4 mb-6">
                            <IconComponent className="h-10 w-10" />
                            <div>
                              <h3 className="text-2xl font-bold">{piece.letter} - {piece.title}</h3>
                              <p className="text-sm opacity-90">{piece.subtitle}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Exemplo Prático
                              </h4>
                              <p className="text-sm">{piece.expandedContent.example}</p>
                            </div>
                            
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Case Real
                              </h4>
                              <p className="text-sm mb-2">{piece.expandedContent.case}</p>
                              <div className="inline-block bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-xs font-semibold">
                                {piece.expandedContent.metrics}
                              </div>
                            </div>
                            
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                              <h4 className="font-semibold mb-2">Tipos de Posts</h4>
                              <div className="flex flex-wrap gap-2">
                                {piece.expandedContent.posts.map((post, idx) => (
                                  <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-xs">
                                    {post}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Elemento Central Melhorado */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border-4 border-white/30 z-30">
              <Puzzle className="h-10 w-10 md:h-12 md:w-12 text-white animate-pulse" />
            </div>
            
            {/* Linhas Conectoras Animadas */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" opacity="0.3">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 0.6 }} />
                </linearGradient>
              </defs>
              {positions.map((_, index) => {
                if (index < positions.length - 1) {
                  return (
                    <line
                      key={index}
                      x1={`${20 + (index % 3) * 30}%`}
                      y1={`${20 + Math.floor(index / 3) * 30}%`}
                      x2={`${20 + ((index + 1) % 3) * 30}%`}
                      y2={`${20 + Math.floor((index + 1) / 3) * 30}%`}
                      stroke="url(#line-gradient)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>

        {/* Call to Action Poderoso */}
        <div className="text-center">
          <p className="text-2xl md:text-3xl text-gray-800 mb-8 font-semibold leading-relaxed">
            Cada <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">T.A.C.C.O.H.</span> é uma peça estratégica que resolve um problema específico do seu conteúdo.
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Com essa metodologia exclusiva, transformamos marcas que "não sabem o que postar" em 
            <strong className="text-emerald-600"> autoridades que geram engajamento e vendas consistentes</strong>.
          </p>

          {/* CTAs Múltiplos */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3">
              Aplique o TACCOH na Sua Marca
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="group bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 text-blue-600 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:bg-blue-50 flex items-center gap-3">
              <Play className="h-5 w-5" />
              Ver Cases Completos
            </button>
          </div>

          {/* Urgência */}
          <div className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-6 py-3 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Vagas limitadas para consultoria personalizada</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohPuzzleHero;
