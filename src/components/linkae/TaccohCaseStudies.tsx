
import React, { useState, useEffect } from 'react';
import { 
  Play, 
  TrendingUp, 
  Users, 
  Heart, 
  ShoppingCart, 
  Star, 
  ArrowRight,
  Stethoscope,
  Dumbbell,
  ChefHat,
  Building2,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Target,
  Trophy,
  Clock,
  DollarSign,
  TrendingDown,
  Shield,
  Award,
  Zap
} from 'lucide-react';

const TaccohCaseStudies: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);
  const [counters, setCounters] = useState({
    cases: 0,
    revenue: 0,
    avgGrowth: 0,
    satisfaction: 0
  });

  // Animated counter effect
  useEffect(() => {
    const targets = { cases: 45, revenue: 1200000, avgGrowth: 285, satisfaction: 98 };
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    const timer = setInterval(() => {
      setCounters(prev => {
        const newCounters = { ...prev };
        let allComplete = true;

        Object.keys(targets).forEach(key => {
          const target = targets[key as keyof typeof targets];
          const current = prev[key as keyof typeof prev];
          if (current < target) {
            newCounters[key as keyof typeof newCounters] = Math.min(
              current + Math.ceil(target / steps),
              target
            );
            allComplete = false;
          }
        });

        if (allComplete) {
          clearInterval(timer);
        }

        return newCounters;
      });
    }, increment);

    return () => clearInterval(timer);
  }, []);

  const caseStudies = [
    {
      id: 0,
      business: 'Clínica Odontológica Especializada',
      industry: 'Healthcare',
      icon: Stethoscope,
      timeline: '90 dias',
      investment: 'R$ 8.500',
      taccohUsed: ['T', 'A'],
      challenge: 'Pacientes não confiavam em tratamentos especializados de alto valor, resultando em baixa conversão e tickets médios reduzidos.',
      solution: 'Técnico: Demonstrações visuais detalhadas dos procedimentos e benefícios\nAutoridade: Showcase de casos de sucesso com certificações e especializações da equipe',
      results: {
        roi: '1.250%',
        engagement: '+340%',
        leads: '+180%',
        conversion: '+95%',
        revenue: 'R$ 106.250'
      },
      metrics: {
        newPatients: 245,
        averageTicket: 'R$ 1.850',
        retention: '89%',
        referrals: '+150%'
      },
      quote: '"A estratégia T.A.C.C.O.H. transformou nossa clínica na referência regional. Pacientes chegam já educados sobre os tratamentos."',
      author: 'Dr. Carlos Mendes',
      position: 'Diretor Clínico',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 1,
      business: 'Personal Training Premium',
      industry: 'Fitness & Wellness',
      icon: Dumbbell,
      timeline: '120 dias',
      investment: 'R$ 5.200',
      taccohUsed: ['C', 'O'],
      challenge: 'Competição acirrada com academias tradicionais e percepção de que treino individualizado era supérfluo.',
      solution: 'Crescimento: Transformações reais dos clientes com conteúdo viral\nObjeção: Demonstração científica dos riscos do treino sem supervisão profissional',
      results: {
        roi: '980%',
        engagement: '+520%',
        leads: '+250%',
        conversion: '+150%',
        revenue: 'R$ 50.960'
      },
      metrics: {
        newClients: 156,
        averageTicket: 'R$ 890',
        retention: '94%',
        referrals: '+200%'
      },
      quote: '"Minha estratégia de conteúdo no Instagram gerou mais clientes qualificados do que anos de marketing tradicional."',
      author: 'Marina Silva',
      position: 'Personal Trainer',
      color: 'from-green-400 to-emerald-600'
    },
    {
      id: 2,
      business: 'Restaurante Familiar Gourmet',
      industry: 'Food & Beverage',
      icon: ChefHat,
      timeline: '75 dias',
      investment: 'R$ 3.800',
      taccohUsed: ['C', 'H'],
      challenge: 'Competição com franquias grandes e dificuldade em comunicar o valor da experiência gastronômica artesanal.',
      solution: 'Conexão: Storytelling da história familiar e tradições culinárias\nHype: Adaptação criativa de trends gastronômicas mantendo a identidade',
      results: {
        roi: '875%',
        engagement: '+280%',
        leads: '+190%',
        conversion: '+120%',
        revenue: 'R$ 33.250'
      },
      metrics: {
        newCustomers: 890,
        averageTicket: 'R$ 125',
        retention: '76%',
        referrals: '+165%'
      },
      quote: '"Nossa história familiar conquistou mais clientes do que qualquer promoção tradicional. A conexão emocional é real."',
      author: 'João Oliveira',
      position: 'Chef Proprietário',
      color: 'from-pink-400 to-rose-500'
    },
    {
      id: 3,
      business: 'Arquitetura Residencial de Alto Padrão',
      industry: 'Architecture & Design',
      icon: Building2,
      timeline: '150 dias',
      investment: 'R$ 12.000',
      taccohUsed: ['T', 'A', 'O'],
      challenge: 'Clientes viam arquitetura como luxo desnecessário, focando apenas no custo sem entender o valor agregado.',
      solution: 'Técnico: Process revelation dos projetos e metodologia\nAutoridade: Cases de valorização imobiliária comprovada\nObjeção: Demonstração do custo real de não contratar um profissional',
      results: {
        roi: '1.180%',
        engagement: '+380%',
        leads: '+220%',
        conversion: '+160%',
        revenue: 'R$ 141.600'
      },
      metrics: {
        newProjects: 28,
        averageTicket: 'R$ 45.000',
        retention: '92%',
        referrals: '+180%'
      },
      quote: '"Mostrar meu processo de trabalho mudou completamente como o mercado me percebe. Agora sou vista como investimento."',
      author: 'Ana Beatriz Santos',
      position: 'Arquiteta Sênior',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const currentCase = caseStudies[activeCase];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-linkae-dark-blue/5 to-linkae-royal-blue/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Premium Hero Section */}
        <div className="text-center mb-20">
          <div className="flex justify-center items-center gap-3 mb-6">
            <Trophy className="h-8 w-8 text-linkae-bright-blue" />
            <span className="text-linkae-bright-blue font-semibold text-lg">Resultados Comprovados</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-linkae-dark-blue">
            Cases reais de 
            <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent block md:inline">
              T.A.C.C.O.H.
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-linkae-dark-blue/70 max-w-4xl mx-auto mb-12 leading-relaxed">
            Transformações reais de negócios que aplicaram nossa metodologia estratégica e 
            <strong className="text-linkae-dark-blue"> multiplicaram seus resultados</strong> em redes sociais.
          </p>

          {/* Animated Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-linkae-dark-blue mb-2">
                {counters.cases}+
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Target className="h-4 w-4" />
                Cases de Sucesso
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ {(counters.revenue / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Faturamento Gerado
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {counters.avgGrowth}%
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Crescimento Médio
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {counters.satisfaction}%
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <Star className="h-4 w-4" />
                Satisfação
              </div>
            </div>
          </div>
        </div>

        {/* Professional Case Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {caseStudies.map((study, index) => {
            const IconComponent = study.icon;
            return (
              <button
                key={study.id}
                onClick={() => setActiveCase(index)}
                className={`group relative p-6 rounded-2xl transition-all duration-300 border-2 text-left ${
                  activeCase === index
                    ? `bg-gradient-to-r ${study.color} text-white border-transparent shadow-xl scale-105`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-linkae-bright-blue hover:shadow-lg hover:scale-102'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl ${
                    activeCase === index 
                      ? 'bg-white/20' 
                      : 'bg-linkae-bright-blue/10 group-hover:bg-linkae-bright-blue/20'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      activeCase === index ? 'text-white' : 'text-linkae-bright-blue'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{study.business}</h3>
                    <p className={`text-sm ${
                      activeCase === index ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {study.industry}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">ROI</span>
                    <span className="font-bold">{study.results.roi}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Timeline</span>
                    <span className="font-bold">{study.timeline}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Investimento</span>
                    <span className="font-bold">{study.investment}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-current/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">T.A.C.C.O.H.:</span>
                    <div className="flex gap-1">
                      {study.taccohUsed.map((letter, idx) => (
                        <span key={idx} className="bg-current/20 px-2 py-1 rounded text-xs font-bold">
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Premium Case Study Layout */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Company Header */}
          <div className={`bg-gradient-to-r ${currentCase.color} p-8 md:p-12 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-6 mb-6">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <currentCase.icon className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-2">{currentCase.business}</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 opacity-80" />
                      <span className="text-lg opacity-90">{currentCase.industry}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 opacity-80" />
                      <span className="text-lg opacity-90">{currentCase.timeline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 opacity-80" />
                      <span className="text-lg opacity-90">{currentCase.investment}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium opacity-90">Metodologia T.A.C.C.O.H. aplicada:</span>
                <div className="flex gap-2">
                  {currentCase.taccohUsed.map((letter, index) => (
                    <span key={index} className="bg-white/20 px-3 py-1 rounded-lg text-lg font-bold">
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Column - Challenge & Solution */}
              <div className="space-y-8">
                {/* Challenge */}
                <div className="bg-red-50 p-6 rounded-2xl border-l-4 border-red-500">
                  <h4 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6" />
                    Desafio Empresarial
                  </h4>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {currentCase.challenge}
                  </p>
                </div>

                {/* Solution */}
                <div className="bg-green-50 p-6 rounded-2xl border-l-4 border-green-500">
                  <h4 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6" />
                    Estratégia T.A.C.C.O.H.
                  </h4>
                  <div className="space-y-4">
                    {currentCase.solution.split('\n').map((line, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-gray-700 text-lg">
                            <strong className="text-green-700">{line.split(':')[0]}:</strong> {line.split(':')[1]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-linkae-bright-blue p-2 rounded-full">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-gray-900 text-lg">Depoimento do Cliente</span>
                  </div>
                  <blockquote className="text-gray-700 italic text-lg mb-4 leading-relaxed">
                    "{currentCase.quote}"
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <cite className="text-gray-900 font-bold text-lg not-italic">{currentCase.author}</cite>
                      <p className="text-gray-600">{currentCase.position}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Results Dashboard */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-8 w-8 text-linkae-bright-blue" />
                  <h4 className="text-2xl font-bold text-gray-900">Dashboard de Resultados</h4>
                </div>

                {/* Financial Results */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-800 font-bold text-lg">Retorno Financeiro</span>
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Investimento</p>
                      <p className="text-2xl font-bold text-green-900">{currentCase.investment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Retorno</p>
                      <p className="text-2xl font-bold text-green-900">{currentCase.results.revenue}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-green-700">ROI</p>
                    <p className="text-3xl font-bold text-green-900">{currentCase.results.roi}</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-800 font-medium">Engajamento</span>
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{currentCase.results.engagement}</div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-800 font-medium">Novos Leads</span>
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{currentCase.results.leads}</div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-yellow-800 font-medium">Conversão</span>
                      <ShoppingCart className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{currentCase.results.conversion}</div>
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-800 font-medium">Ticket Médio</span>
                      <TrendingUp className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{currentCase.metrics.averageTicket}</div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="bg-gradient-to-r from-linkae-dark-blue/5 to-linkae-royal-blue/10 p-6 rounded-2xl border border-linkae-bright-blue/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-linkae-bright-blue" />
                    <span className="font-bold text-linkae-dark-blue">Indicadores de Sucesso</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Retenção</p>
                      <p className="font-bold text-linkae-dark-blue">{currentCase.metrics.retention}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Indicações</p>
                      <p className="font-bold text-linkae-dark-blue">{currentCase.metrics.referrals}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Bottom CTA */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-linkae-dark-blue via-linkae-royal-blue to-linkae-dark-blue p-8 md:p-16 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex justify-center items-center gap-3 mb-6">
                <Target className="h-8 w-8 text-linkae-cyan-light" />
                <span className="text-linkae-cyan-light font-semibold text-lg">Próximo Passo</span>
              </div>
              
              <h3 className="text-3xl md:text-5xl font-bold mb-6">
                Seu negócio pode ser o próximo 
                <span className="bg-gradient-to-r from-linkae-cyan-light to-white bg-clip-text text-transparent block md:inline">
                  case de sucesso
                </span>
              </h3>
              
              <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed">
                Cada negócio tem sua combinação ideal de <strong>T.A.C.C.O.H.</strong> 
                Nossa equipe especializada identifica exatamente quais pilares sua marca precisa para 
                <strong className="text-linkae-cyan-light"> multiplicar seus resultados</strong>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <div className="flex items-center gap-2 text-linkae-cyan-light">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Análise personalizada gratuita</span>
                </div>
                <div className="flex items-center gap-2 text-linkae-cyan-light">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Estratégia sob medida</span>
                </div>
                <div className="flex items-center gap-2 text-linkae-cyan-light">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Resultados em 90 dias</span>
                </div>
              </div>
              
              <button className="bg-linkae-cyan-light text-linkae-dark-blue px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-2xl hover:bg-white transition-all inline-flex items-center gap-3 group">
                <span>Agendar Análise Estratégica T.A.C.C.O.H.</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-sm opacity-70 mt-4">
                ✓ Sem compromisso • ✓ Consulta gratuita • ✓ Resultados garantidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohCaseStudies;
