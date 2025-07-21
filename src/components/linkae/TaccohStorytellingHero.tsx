
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Heart, Target, Zap, MapPin, Store, Utensils, Stethoscope, Dumbbell, Calendar, ShoppingBag } from 'lucide-react';

const TaccohStorytellingHero: React.FC = () => {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeBlock, setActiveBlock] = useState(0);

  const storyBlocks = [
    {
      id: 'conexoes',
      title: 'Criando Conexões',
      subtitle: 'Quando a criatividade encontra a comunidade',
      description: 'Transformamos bloqueios criativos em conexões autênticas que engajam e vendem',
      cases: [
        {
          icon: Store,
          location: 'Foz do Iguaçu',
          business: 'Loja Local',
          problem: 'Falta de criatividade para posts',
          solution: 'Posts que engajam a comunidade local',
          result: '+340% engajamento regional',
          color: 'from-pink-500 to-rose-400'
        },
        {
          icon: Utensils,
          location: 'Centro-Oeste',
          business: 'Restaurante',
          problem: 'Não saber o que postar',
          solution: 'Conteúdos que geram fome emocional',
          result: '+180% reservas online',
          color: 'from-orange-500 to-amber-400'
        }
      ]
    },
    {
      id: 'objecoes',
      title: 'Transformando Objeções',
      subtitle: 'Quando dúvidas se tornam oportunidades',
      description: 'Antecipamos questionamentos e criamos conteúdos que educam e convertem',
      cases: [
        {
          icon: Stethoscope,
          location: 'Região Sul',
          business: 'Clínica Médica',
          problem: 'Pacientes com muitas dúvidas',
          solution: 'Posts educativos que respondem e convertem',
          result: '+250% agendamentos',
          color: 'from-blue-500 to-cyan-400'
        },
        {
          icon: Dumbbell,
          location: 'Grande Curitiba',
          business: 'Academia',
          problem: 'Inseguranças dos alunos',
          solution: 'Narrativas motivacionais que superam medos',
          result: '+320% matrículas',
          color: 'from-emerald-500 to-green-400'
        }
      ]
    },
    {
      id: 'hype',
      title: 'Gerando Hype',
      subtitle: 'Quando o buzz se torna resultado',
      description: 'Criamos campanhas que viralizam e inspiram ação imediata',
      cases: [
        {
          icon: Calendar,
          location: 'Paraguai',
          business: 'Evento Internacional',
          problem: 'Baixa visibilidade regional',
          solution: 'Campanhas que aumentam o buzz',
          result: '+500% participantes',
          color: 'from-purple-500 to-violet-400'
        },
        {
          icon: ShoppingBag,
          location: 'E-commerce',
          business: 'Loja Online',
          problem: 'Sem ideias para posts',
          solution: 'Posts visuais que vendem e inspiram',
          result: '+280% conversões',
          color: 'from-indigo-500 to-blue-400'
        }
      ]
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBlock((prev) => (prev + 1) % storyBlocks.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[80vh] py-16 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-linkae-pink/20 to-linkae-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-100/20 to-linkae-cyan-light/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-linkae-pink/10 to-linkae-orange/10 px-6 py-3 rounded-full border border-linkae-pink/20 mb-6 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-linkae-pink animate-pulse" />
            <span className="text-sm font-semibold text-linkae-dark-blue tracking-wide">STORYTELLING ESTRATÉGICO</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="block bg-gradient-to-r from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue bg-clip-text text-transparent">
              Estratégias que
            </span>
            <span className="block mt-2 bg-gradient-to-r from-linkae-pink via-linkae-orange to-linkae-bright-blue bg-clip-text text-transparent">
              Conectam e Transformam
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
            Cada negócio tem suas dores únicas. Nossas soluções criam <strong className="text-linkae-pink">conexões autênticas</strong> e 
            superam <strong className="text-linkae-orange">objeções específicas</strong>.
          </p>
        </div>

        {/* Story Blocks Navigation */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
            {storyBlocks.map((block, index) => (
              <button
                key={block.id}
                onClick={() => setActiveBlock(index)}
                className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                  activeBlock === index 
                    ? 'bg-gradient-to-r from-linkae-pink to-linkae-orange text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <span className="font-semibold text-sm">{block.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Story Block */}
        <div className="relative">
          {storyBlocks.map((block, blockIndex) => (
            <div
              key={block.id}
              className={`transition-all duration-700 ${
                activeBlock === blockIndex 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8 absolute inset-0 pointer-events-none'
              }`}
            >
              {/* Block Header */}
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-bold text-linkae-dark-blue mb-4">
                  {block.title}
                </h3>
                <p className="text-lg text-linkae-royal-blue mb-2 font-medium">
                  {block.subtitle}
                </p>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {block.description}
                </p>
              </div>

              {/* Cases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {block.cases.map((case_, caseIndex) => {
                  const IconComponent = case_.icon;
                  
                  return (
                    <div
                      key={caseIndex}
                      className={`group bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${animateIn ? 'animate-fade-in' : 'opacity-0'}`}
                      style={{ animationDelay: `${caseIndex * 200}ms` }}
                    >
                      {/* Case Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${case_.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500 font-medium">{case_.location}</span>
                          </div>
                          <h4 className="text-xl font-bold text-linkae-dark-blue">
                            {case_.business}
                          </h4>
                        </div>
                      </div>

                      {/* Problem & Solution */}
                      <div className="space-y-4 mb-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-medium text-red-700 mb-1">Desafio</p>
                              <p className="text-red-600">{case_.problem}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="text-sm font-medium text-green-700 mb-1">Solução</p>
                              <p className="text-green-600">{case_.solution}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Result */}
                      <div className="flex items-center justify-between">
                        <div className={`bg-gradient-to-r ${case_.color} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
                          {case_.result}
                        </div>
                        
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-linkae-bright-blue group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-linkae-pink/10 to-linkae-orange/10 rounded-2xl p-8 backdrop-blur-sm border border-white/30">
            <p className="text-2xl md:text-3xl text-linkae-dark-blue mb-4 font-bold">
              Cada história é uma <span className="bg-gradient-to-r from-linkae-pink to-linkae-orange bg-clip-text text-transparent">estratégia testada</span>
            </p>
            
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              Não trabalhamos com fórmulas genéricas. Cada caso é único, cada solução é <strong className="text-linkae-orange">personalizada</strong> para 
              gerar resultados <strong className="text-linkae-pink">mensuráveis</strong>.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="bg-white/50 px-3 py-1 rounded-full">• Casos reais</span>
              <span className="bg-white/50 px-3 py-1 rounded-full">• Resultados comprovados</span>
              <span className="bg-white/50 px-3 py-1 rounded-full">• Metodologia própria</span>
              <span className="bg-white/50 px-3 py-1 rounded-full">• ROI garantido</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohStorytellingHero;
