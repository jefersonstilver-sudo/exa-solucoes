
import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Heart, Zap, Target, Trophy, Lightbulb } from 'lucide-react';

const TaccohStorytellingHero: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [counters, setCounters] = useState({ brands: 0, engagement: 0, cases: 0, roi: 0 });

  const taccohStories = [
    { 
      id: 'T', 
      letter: 'T', 
      title: 'Técnico', 
      subtitle: 'Demonstre expertise através do processo',
      icon: Trophy,
      story: 'Uma clínica odontológica mostrava apenas resultados finais. Quando começaram a mostrar cada etapa do tratamento, os pacientes passaram a entender o valor e a agendar 250% mais consultas.',
      example: 'Passo a passo do procedimento + explicação técnica = confiança instantânea',
      metrics: '+250% agendamentos'
    },
    { 
      id: 'A', 
      letter: 'A', 
      title: 'Autoridade', 
      subtitle: 'Construa credibilidade com prova social',
      icon: Target,
      story: 'Um personal trainer compartilhava apenas treinos. Ao mostrar suas certificações e transformações dos alunos, virou referência no nicho e multiplicou sua receita.',
      example: 'Certificações + antes/depois + depoimentos = autoridade reconhecida',
      metrics: '+400% conversões'
    },
    { 
      id: 'C1', 
      letter: 'C', 
      title: 'Crescimento', 
      subtitle: 'Ensine para se tornar referência',
      icon: TrendingUp,
      story: 'Uma arquiteta compartilhava apenas projetos prontos. Quando começou a ensinar conceitos de design, seus seguidores viraram clientes fiéis.',
      example: 'Dicas valiosas + educação = seguidores que viram clientes',
      metrics: '+340% alcance'
    },
    { 
      id: 'C2', 
      letter: 'C', 
      title: 'Conexão', 
      subtitle: 'Humanize sua marca com storytelling',
      icon: Heart,
      story: 'Um restaurante familiar contou a história de suas receitas tradicionais. A conexão emocional trouxe mais clientes do que qualquer promoção.',
      example: 'História real + valores familiares = conexão emocional forte',
      metrics: '+180% vendas'
    },
    { 
      id: 'O', 
      letter: 'O', 
      title: 'Objeção', 
      subtitle: 'Antecipe e resolva dúvidas dos clientes',
      icon: Lightbulb,
      story: 'Uma loja online respondia às mesmas dúvidas no direct. Ao criar conteúdo antecipando essas objeções, as vendas dispararam.',
      example: 'FAQ estratégico + quebra de objeções = vendas facilitadas',
      metrics: '+90% conversões'
    },
    { 
      id: 'H', 
      letter: 'H', 
      title: 'Hype', 
      subtitle: 'Aproveite trends para viralizar',
      icon: Zap,
      story: 'Uma cafeteria adaptou um meme viral ao seu contexto. O post teve 2 milhões de visualizações e filas na porta.',
      example: 'Trend adaptado + timing perfeito = viralização orgânica',
      metrics: '+2M views'
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
    <section className="relative min-h-[80vh] py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-indigo-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-green-100/15 to-emerald-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-full border border-blue-200/50 mb-6 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-semibold text-blue-700 tracking-wide">STORYTELLING ESTRATÉGICO</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent">
              Histórias que
            </span>
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Geram Resultados
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
            Cada letra do <strong className="text-blue-600">T.A.C.C.O.H.</strong> conta uma história real de transformação. 
            Veja como diferentes negócios aplicaram nossa metodologia.
          </p>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-3xl font-bold text-blue-600 mb-1">{counters.brands}+</div>
              <div className="text-sm text-gray-600">Marcas transformadas</div>
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

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {taccohStories.map((story, index) => {
            const IconComponent = story.icon;
            
            return (
              <div
                key={story.id}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group ${animateIn ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#3C1361] to-purple-700 p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <span className="text-2xl font-bold">{story.letter}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{story.title}</h3>
                      <IconComponent className="h-5 w-5 opacity-80" />
                    </div>
                  </div>
                  
                  <p className="text-sm opacity-90 relative z-10">{story.subtitle}</p>
                </div>

                {/* Story Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">História Real</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{story.story}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium">{story.example}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Resultado obtido</span>
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      {story.metrics}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <p className="text-2xl md:text-3xl text-gray-800 mb-4 font-semibold">
            Cada história é uma <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">estratégia testada</span>
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            O T.A.C.C.O.H. não é teoria. São <strong className="text-emerald-600">casos reais</strong> que 
            transformaram negócios através de storytelling estratégico.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TaccohStorytellingHero;
