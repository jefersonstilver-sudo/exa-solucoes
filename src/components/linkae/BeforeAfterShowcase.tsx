
import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Heart, MessageCircle, Share2, Eye, ChevronLeft, ChevronRight, Play, Star, Award, Clock, DollarSign, Target, Zap } from 'lucide-react';

const BeforeAfterShowcase: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedNumbers, setAnimatedNumbers] = useState<{ [key: string]: number }>({});

  const comparisons = [
    {
      id: 1,
      niche: 'Clínica Odontológica',
      location: 'São Paulo - SP',
      timeframe: '90 dias',
      investment: 'R$ 2.500',
      revenue: 'R$ 45.000',
      roi: '1.700%',
      before: {
        image: '🦷',
        title: 'Resultado final sem contexto',
        description: 'Apenas foto do sorriso pronto',
        postText: 'Mais um sorriso perfeito! 😁✨',
        metrics: { likes: 23, comments: 2, shares: 0, views: 156, reach: 89, engagement: '1.2%' },
        problems: ['Sem confiança do paciente', 'Parece caro demais', 'Não entendem o processo', 'Baixa credibilidade técnica']
      },
      after: {
        image: '🦷',
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
      before: {
        image: '💪',
        title: 'Treino genérico',
        description: 'Exercícios sem explicação',
        postText: 'Treino de hoje! 💪 #fitness #treino',
        metrics: { likes: 45, comments: 3, shares: 1, views: 234, reach: 123, engagement: '2.1%' },
        problems: ['Falta credibilidade', 'Não diferencia da concorrência', 'Pouco engajamento', 'Sem prova social']
      },
      after: {
        image: '💪',
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
      before: {
        image: '🍝',
        title: 'Foto do prato',
        description: 'Apenas imagem da comida',
        postText: 'Nosso delicioso macarrão! 🍝',
        metrics: { likes: 67, comments: 5, shares: 2, views: 345, reach: 189, engagement: '3.2%' },
        problems: ['Sem diferencial', 'Não gera conexão', 'Esquecível', 'Não conta história']
      },
      after: {
        image: '🍝',
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
      before: {
        image: '👗',
        title: 'Produto isolado',
        description: 'Foto da roupa sem contexto',
        postText: 'Nova coleção chegando! 👗✨',
        metrics: { likes: 34, comments: 1, shares: 0, views: 189, reach: 98, engagement: '1.8%' },
        problems: ['Sem contexto de uso', 'Não resolve dúvidas', 'Baixa conversão', 'Não inspira']
      },
      after: {
        image: '👗',
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
    // Animate numbers when component mounts
    const timer = setTimeout(() => {
      setAnimatedNumbers({
        likes: currentComparison.after.metrics.likes,
        comments: currentComparison.after.metrics.comments,
        views: currentComparison.after.metrics.views,
        reach: currentComparison.after.metrics.reach
      });
    }, 500);

    return () => clearTimeout(timer);
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

  const PhoneMockup = ({ type, data, metrics, postText }: { type: 'before' | 'after'; data: any; metrics: any; postText: string }) => (
    <div className={`relative mx-auto transform transition-all duration-700 hover:scale-105 ${type === 'before' ? 'hover:rotate-1' : 'hover:-rotate-1'}`}>
      {/* Phone Frame */}
      <div className="relative w-72 h-[600px] bg-black rounded-[3rem] p-2 shadow-2xl">
        {/* Screen */}
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Status Bar */}
          <div className="bg-white px-6 py-3 flex justify-between items-center text-black text-sm font-medium">
            <span>9:41</span>
            <span>📶 📶 📶 🔋</span>
          </div>
          
          {/* Instagram Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🏢</span>
              </div>
              <span className="font-semibold text-gray-900">{currentComparison.niche}</span>
            </div>
            <div className="text-gray-400">•••</div>
          </div>

          {/* Post Image */}
          <div className={`w-full h-64 flex items-center justify-center text-8xl ${type === 'before' ? 'bg-gray-100' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
            {data.image}
          </div>

          {/* Post Engagement */}
          <div className="px-4 py-3 bg-white">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <Heart className={`h-6 w-6 ${type === 'after' ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  <MessageCircle className="h-6 w-6 text-gray-400" />
                  <Share2 className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-semibold text-gray-900">
                {type === 'after' ? <AnimatedNumber value={metrics.likes} /> : metrics.likes} curtidas
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{currentComparison.niche}</span> {postText}
              </div>
              <div className="text-xs text-gray-400">
                Ver todos os {type === 'after' ? <AnimatedNumber value={metrics.comments} /> : metrics.comments} comentários
              </div>
            </div>
          </div>

          {/* Metrics Overlay */}
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className={`bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border ${type === 'after' ? 'border-green-200' : 'border-red-200'}`}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className={`font-bold ${type === 'after' ? 'text-green-600' : 'text-red-500'}`}>
                    {type === 'after' ? <AnimatedNumber value={metrics.views} /> : metrics.views}
                  </div>
                  <div className="text-gray-500">Visualizações</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${type === 'after' ? 'text-green-600' : 'text-red-500'}`}>
                    {type === 'after' ? <AnimatedNumber value={metrics.reach} /> : metrics.reach}
                  </div>
                  <div className="text-gray-500">Alcance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge */}
      <div className={`absolute -top-4 -right-4 px-3 py-1 rounded-full text-white text-xs font-semibold shadow-lg ${
        type === 'before' ? 'bg-red-500' : 'bg-green-500'
      }`}>
        {type === 'before' ? 'ANTES' : 'DEPOIS'}
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

        {/* Phone Mockups Comparison */}
        <div className="grid lg:grid-cols-2 gap-16 mb-16">
          {/* ANTES */}
          <div className="text-center">
            <PhoneMockup 
              type="before" 
              data={currentComparison.before} 
              metrics={currentComparison.before.metrics}
              postText={currentComparison.before.postText}
            />
            
            <div className="mt-8 space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">❌ Problemas Identificados</h3>
              <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
                <div className="space-y-3">
                  {currentComparison.before.problems.map((problem, index) => (
                    <div key={index} className="flex items-center gap-3 text-red-300">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{problem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DEPOIS */}
          <div className="text-center">
            <PhoneMockup 
              type="after" 
              data={currentComparison.after} 
              metrics={currentComparison.after.metrics}
              postText={currentComparison.after.postText}
            />
            
            <div className="mt-8 space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">✅ Resultados Alcançados</h3>
              <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
                <div className="space-y-3">
                  {currentComparison.after.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 text-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
