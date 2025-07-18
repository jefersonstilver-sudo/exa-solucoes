
import React, { useState, useEffect } from 'react';
import { Puzzle, Sparkles, TrendingUp, Users, Heart, Zap, ArrowRight, Play, BarChart3, Target, Lightbulb, Trophy } from 'lucide-react';

const TaccohPuzzleHero: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [counters, setCounters] = useState({ brands: 0, engagement: 0, cases: 0, roi: 0 });

  const taccohData = [
    { 
      id: 'T', 
      letter: 'T', 
      title: 'Técnico', 
      subtitle: 'Demonstre expertise através do processo',
      color: 'from-blue-500 via-blue-600 to-indigo-600',
      icon: Puzzle,
      description: 'Mostre o processo, gere confiança técnica',
      example: 'Tutorial step-by-step que gera 300% mais engajamento',
      case: 'Salão que mostrou técnica de corte: +250% agendamentos',
      metrics: '+300% engajamento',
      posts: ['Como fazer X', 'Passo a passo', 'Bastidores do processo']
    },
    { 
      id: 'A', 
      letter: 'A', 
      title: 'Autoridade', 
      subtitle: 'Construa credibilidade com prova social',
      color: 'from-yellow-400 via-orange-400 to-orange-500',
      icon: Trophy,
      description: 'Conquistas, credibilidade, cases',
      example: 'Certificações + depoimentos = confiança instantânea',
      case: 'Dentista que mostrou casos: +400% conversões',
      metrics: '+400% conversões',
      posts: ['Certificações', 'Depoimentos', 'Prêmios e conquistas']
    },
    { 
      id: 'C1', 
      letter: 'C', 
      title: 'Crescimento', 
      subtitle: 'Ensine para se tornar referência',
      color: 'from-green-400 via-emerald-500 to-emerald-600',
      icon: TrendingUp,
      description: 'Inspire, ensine, viralize',
      example: 'Dicas valiosas que viralizam naturalmente',
      case: 'Coach que ensinou técnicas: 50k seguidores em 3 meses',
      metrics: '+340% alcance',
      posts: ['Dicas valiosas', 'Tutoriais', 'Conteúdo educativo']
    },
    { 
      id: 'C2', 
      letter: 'C', 
      title: 'Conexão', 
      subtitle: 'Humanize sua marca com storytelling',
      color: 'from-pink-400 via-rose-500 to-rose-600',
      icon: Heart,
      description: 'Histórias reais, emoção, humanidade',
      example: 'Histórias pessoais que geram identificação',
      case: 'Loja que contou origem: +180% vendas orgânicas',
      metrics: '+180% vendas',
      posts: ['História pessoal', 'Valores da marca', 'Momentos especiais']
    },
    { 
      id: 'O', 
      letter: 'O', 
      title: 'Objeção', 
      subtitle: 'Antecipe e resolva dúvidas dos clientes',
      color: 'from-red-500 via-red-600 to-pink-600',
      icon: Target,
      description: 'Antecipe e quebra barreiras',
      example: "FAQ's transformados em conteúdo persuasivo",
      case: 'E-commerce que respondeu objeções: +90% conversões',
      metrics: '+90% conversões',
      posts: ['FAQ interativo', 'Mitos vs Verdades', 'Esclarecimentos']
    },
    { 
      id: 'H', 
      letter: 'H', 
      title: 'Hype', 
      subtitle: 'Aproveite trends para viralizar',
      color: 'from-orange-400 via-yellow-500 to-yellow-600',
      icon: Zap,
      description: 'Trends, memes, viral',
      example: 'Adapte memes ao seu nicho estrategicamente',
      case: 'Restaurante que surfou trend: 2M visualizações',
      metrics: '+2M views',
      posts: ['Trends adaptados', 'Memes do nicho', 'Conteúdo viral']
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

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background Avançado */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        
        {/* Elementos Geométricos Animados */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-indigo-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-green-100/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full border border-blue-200/50 mb-4 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 tracking-wide">MÉTODO EXCLUSIVO</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent">
              Não sabe o que postar?
            </span>
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Descubra o T.A.C.C.O.H.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
            O método estratégico que <strong className="text-blue-600">grandes marcas</strong> usam para criar 
            conteúdo que <strong className="text-emerald-600">realmente converte</strong>.
          </p>

          {/* Estatísticas Impressionantes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
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

        {/* Cards T.A.C.C.O.H. - Layout Simples em Grid */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {taccohData.map((piece, index) => {
              const IconComponent = piece.icon;
              
              return (
                <div
                  key={piece.id}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group ${animateIn ? 'animate-fade-in' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header do Card */}
                  <div className={`bg-gradient-to-br ${piece.color} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="flex items-center gap-4 mb-3 relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-2xl font-bold">{piece.letter}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{piece.title}</h3>
                        <IconComponent className="h-5 w-5 opacity-80" />
                      </div>
                    </div>
                    
                    <p className="text-sm opacity-90 relative z-10">{piece.subtitle}</p>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-6 space-y-4">
                    {/* Case Real */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Case Real
                      </h4>
                      <p className="text-sm text-blue-800 mb-2">{piece.case}</p>
                      <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {piece.metrics}
                      </div>
                    </div>

                    {/* Exemplo Prático */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Exemplo Prático
                      </h4>
                      <p className="text-sm text-green-800">{piece.example}</p>
                    </div>

                    {/* Tipos de Posts */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Tipos de Posts</h4>
                      <div className="space-y-2">
                        {piece.posts.map((post, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-700">{post}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action Poderoso */}
        <div className="text-center">
          <p className="text-2xl md:text-3xl text-gray-800 mb-6 font-semibold leading-relaxed">
            Cada <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">T.A.C.C.O.H.</span> é uma peça estratégica que resolve um problema específico do seu conteúdo.
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
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
          <div className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-6 py-3 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-700">Vagas limitadas para consultoria personalizada</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohPuzzleHero;
