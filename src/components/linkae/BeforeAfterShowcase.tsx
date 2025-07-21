
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Heart, MessageCircle, Share2, Eye, ChevronLeft, ChevronRight, Star, Award, Clock, DollarSign, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';

const BeforeAfterShowcase: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const comparisons = [
    {
      id: 1,
      niche: 'Clínica Odontológica',
      location: 'São Paulo - SP',
      timeframe: '90 dias',
      investment: 'R$ 2.500',
      revenue: 'R$ 45.000',
      roi: '1.700%',
      emoji: '🦷',
      before: {
        title: 'Resultado final sem contexto',
        description: 'Apenas foto do sorriso pronto',
        postText: 'Mais um sorriso perfeito! 😁✨',
        metrics: { likes: 23, comments: 2, shares: 0, views: 156, reach: 89, engagement: '1.2%' },
        problems: ['Sem confiança do paciente', 'Parece caro demais', 'Não entendem o processo', 'Baixa credibilidade técnica']
      },
      after: {
        title: 'Processo completo (TÉCNICO)',
        description: 'Passo a passo do tratamento',
        postText: 'THREAD: Como transformamos este sorriso em 3 etapas (salvem este post!) 👇',
        metrics: { likes: 2340, comments: 187, shares: 89, views: 45600, reach: 28900, engagement: '8.9%' },
        benefits: ['Transparência total', 'Valor percebido alto', 'Confiança técnica', 'Autoridade reconhecida']
      },
      testimonial: 'Dr. Silva conseguiu 15 novos pacientes só neste mês!',
      badge: 'Verificado'
    },
    {
      id: 2,
      niche: 'Personal Trainer',
      location: 'Rio de Janeiro - RJ',
      timeframe: '60 dias',
      investment: 'R$ 1.800',
      revenue: 'R$ 28.000',
      roi: '1.456%',
      emoji: '💪',
      before: {
        title: 'Treino genérico',
        description: 'Exercícios sem explicação',
        postText: 'Treino de hoje! 💪 #fitness #treino',
        metrics: { likes: 45, comments: 3, shares: 1, views: 234, reach: 123, engagement: '2.1%' },
        problems: ['Falta credibilidade', 'Não diferencia da concorrência', 'Pouco engajamento', 'Sem prova social']
      },
      after: {
        title: 'Autoridade + Transformação',
        description: 'Certificações + resultados reais',
        postText: 'Por que 90% falham na dieta? (A verdade que ninguém conta)',
        metrics: { likes: 1890, comments: 234, shares: 67, views: 38400, reach: 22100, engagement: '12.3%' },
        benefits: ['Autoridade reconhecida', 'Educação de qualidade', 'Prova social forte', 'Diferencial técnico']
      },
      testimonial: 'Marina aumentou sua lista de espera em 300%!',
      badge: 'Top Performer'
    },
    {
      id: 3,
      niche: 'Restaurante',
      location: 'Belo Horizonte - MG',
      timeframe: '45 dias',
      investment: 'R$ 1.200',
      revenue: 'R$ 18.500',
      roi: '1.442%',
      emoji: '🍝',
      before: {
        title: 'Foto do prato',
        description: 'Apenas imagem da comida',
        postText: 'Nosso delicioso macarrão! 🍝',
        metrics: { likes: 67, comments: 5, shares: 2, views: 345, reach: 189, engagement: '3.2%' },
        problems: ['Sem diferencial', 'Não gera conexão', 'Esquecível', 'Não conta história']
      },
      after: {
        title: 'História familiar (CONEXÃO)',
        description: 'Receita da nonna + processo',
        postText: 'Esta receita chegou ao Brasil em 1952 com minha nonna... (história completa nos comentários)',
        metrics: { likes: 2156, comments: 312, shares: 198, views: 52300, reach: 34200, engagement: '15.7%' },
        benefits: ['Storytelling emocional', 'Receita exclusiva', 'Conexão familiar', 'Diferencial único']
      },
      testimonial: 'Famiglia Rossi dobrou o movimento nos fins de semana!',
      badge: 'Sucesso Viral'
    },
    {
      id: 4,
      niche: 'Loja de Roupas',
      location: 'Curitiba - PR',
      timeframe: '30 dias',
      investment: 'R$ 1.500',
      revenue: 'R$ 22.000',
      roi: '1.367%',
      emoji: '👗',
      before: {
        title: 'Produto isolado',
        description: 'Foto da roupa sem contexto',
        postText: 'Nova coleção chegando! 👗✨',
        metrics: { likes: 34, comments: 1, shares: 0, views: 189, reach: 98, engagement: '1.8%' },
        problems: ['Sem contexto de uso', 'Não resolve dúvidas', 'Baixa conversão', 'Não inspira']
      },
      after: {
        title: 'Styling completo',
        description: 'Look montado + dicas de uso',
        postText: '3 looks com a mesma peça (você vai se surpreender com o look 2!) 👇',
        metrics: { likes: 1567, comments: 189, shares: 234, views: 41200, reach: 28700, engagement: '11.2%' },
        benefits: ['Inspiração visual', 'Dicas de styling', 'Múltiplas ocasiões', 'Valor percebido']
      },
      testimonial: 'Bella Moda aumentou as vendas online em 400%!',
      badge: 'Trending'
    }
  ];

  const currentComparison = comparisons[activeSlide];

  useEffect(() => {
    setIsVisible(true);
  }, [activeSlide]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % comparisons.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + comparisons.length) % comparisons.length);
  };

  const AnimatedNumber = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;
        
        if (progress < 1) {
          setDisplayValue(Math.floor(value * progress));
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{displayValue.toLocaleString()}</span>;
  };

  const ComparisonCard = ({ type, data, emoji }: { type: 'before' | 'after'; data: any; emoji: string }) => (
    <div className={`relative group h-full`}>
      <div className={`relative h-full p-8 rounded-3xl backdrop-blur-sm border transition-all duration-700 hover:scale-105 ${
        type === 'before' 
          ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
          : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className={`px-4 py-2 rounded-full text-white text-sm font-semibold ${
            type === 'before' ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {type === 'before' ? '❌ ANTES' : '✅ DEPOIS'}
          </div>
          <div className="text-6xl opacity-20 group-hover:opacity-40 transition-opacity">
            {emoji}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h3 className={`text-2xl font-bold mb-2 ${
              type === 'before' ? 'text-red-300' : 'text-green-300'
            }`}>
              {data.title}
            </h3>
            <p className="text-white/80 text-lg">{data.description}</p>
          </div>

          {/* Post Preview */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🏢</span>
              </div>
              <span className="font-semibold text-white">{currentComparison.niche}</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              {data.postText}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                type === 'before' ? 'text-red-400' : 'text-green-400'
              }`}>
                {type === 'after' ? <AnimatedNumber value={data.metrics.likes} /> : data.metrics.likes}
              </div>
              <div className="text-white/60 text-sm flex items-center justify-center gap-1">
                <Heart className="h-4 w-4" />
                Curtidas
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                type === 'before' ? 'text-red-400' : 'text-green-400'
              }`}>
                {type === 'after' ? <AnimatedNumber value={data.metrics.comments} /> : data.metrics.comments}
              </div>
              <div className="text-white/60 text-sm flex items-center justify-center gap-1">
                <MessageCircle className="h-4 w-4" />
                Comentários
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                type === 'before' ? 'text-red-400' : 'text-green-400'
              }`}>
                {type === 'after' ? <AnimatedNumber value={data.metrics.views} /> : data.metrics.views}
              </div>
              <div className="text-white/60 text-sm flex items-center justify-center gap-1">
                <Eye className="h-4 w-4" />
                Visualizações
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-1 ${
                type === 'before' ? 'text-red-400' : 'text-green-400'
              }`}>
                {type === 'after' ? <AnimatedNumber value={data.metrics.reach} /> : data.metrics.reach}
              </div>
              <div className="text-white/60 text-sm flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Alcance
              </div>
            </div>
          </div>

          {/* Problems/Benefits */}
          <div className="space-y-3">
            <h4 className={`text-lg font-semibold ${
              type === 'before' ? 'text-red-300' : 'text-green-300'
            }`}>
              {type === 'before' ? 'Problemas Identificados' : 'Resultados Alcançados'}
            </h4>
            <div className="space-y-2">
              {(type === 'before' ? data.problems : data.benefits).map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  {type === 'before' ? (
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-white/80 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-linkae-cyan-light rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">Resultados Comprovados</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Antes vs <span className="bg-gradient-to-r from-linkae-cyan-light to-pink-300 bg-clip-text text-transparent">Depois</span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Transformações reais de clientes que aplicaram a metodologia <strong>T.A.C.C.O.H.</strong>
          </p>
        </div>

        {/* Case Info Bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-12 border border-white/20">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-linkae-cyan-light" />
              <span className="text-sm">Nicho:</span>
              <span className="font-semibold">{currentComparison.niche}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-linkae-cyan-light" />
              <span className="text-sm">Tempo:</span>
              <span className="font-semibold">{currentComparison.timeframe}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-linkae-cyan-light" />
              <span className="text-sm">Investimento:</span>
              <span className="font-semibold">{currentComparison.investment}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-sm">Faturamento:</span>
              <span className="font-semibold text-green-400">{currentComparison.revenue}</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
              <Zap className="h-4 w-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">ROI: {currentComparison.roi}</span>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 text-white border border-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex gap-2">
            {comparisons.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`w-12 h-3 rounded-full transition-all duration-300 ${
                  index === activeSlide ? 'bg-linkae-cyan-light' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 text-white border border-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Comparison Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <ComparisonCard 
            type="before" 
            data={currentComparison.before} 
            emoji={currentComparison.emoji}
          />
          <ComparisonCard 
            type="after" 
            data={currentComparison.after} 
            emoji={currentComparison.emoji}
          />
        </div>

        {/* Impact Metrics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-2">Impacto Mensurável</h3>
            <p className="text-white/80">Números que falam por si só</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-linkae-cyan-light mb-2">
                +{Math.round(((currentComparison.after.metrics.likes - currentComparison.before.metrics.likes) / currentComparison.before.metrics.likes) * 100)}%
              </div>
              <div className="text-white/80 text-sm">Curtidas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                +{Math.round(((currentComparison.after.metrics.comments - currentComparison.before.metrics.comments) / currentComparison.before.metrics.comments) * 100)}%
              </div>
              <div className="text-white/80 text-sm">Comentários</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-300 mb-2">
                +{Math.round(((currentComparison.after.metrics.views - currentComparison.before.metrics.views) / currentComparison.before.metrics.views) * 100)}%
              </div>
              <div className="text-white/80 text-sm">Visualizações</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300 mb-2">
                +{Math.round(((currentComparison.after.metrics.reach - currentComparison.before.metrics.reach) / currentComparison.before.metrics.reach) * 100)}%
              </div>
              <div className="text-white/80 text-sm">Alcance</div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
            </div>
            <p className="text-xl text-white mb-4">"{currentComparison.testimonial}"</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-linkae-cyan-light font-semibold">{currentComparison.badge}</span>
              <span className="text-white/60">• {currentComparison.location}</span>
            </div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="text-center mt-16">
          <p className="text-xl text-white/90 max-w-4xl mx-auto">
            Cada post é uma oportunidade de <strong className="text-linkae-cyan-light">conectar, educar e converter</strong>. 
            Com <strong className="text-pink-300">T.A.C.C.O.H.</strong>, transformamos conteúdo comum em resultados extraordinários.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterShowcase;
