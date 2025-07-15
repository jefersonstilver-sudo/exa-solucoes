import React, { useState, useRef, useEffect } from 'react';
import { Target, Users, Lightbulb, Cog, Heart, Trophy, ArrowRight, Play } from 'lucide-react';

const TaccohMethodSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % taccohSteps.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const taccohSteps = [
    {
      letter: "T",
      title: "Target",
      subtitle: "Definição Estratégica",
      description: "Identificamos seu público-alvo, objetivos de comunicação e métricas de sucesso antes de qualquer produção.",
      icon: Target,
      color: "from-indexa-purple to-indexa-purple-dark",
      results: ["Público definido", "Objetivos claros", "KPIs estabelecidos"]
    },
    {
      letter: "A",
      title: "Audience",
      subtitle: "Análise Comportamental",
      description: "Mapeamos o comportamento, preferências e jornada da sua audiência para criar conteúdo que ressoa.",
      icon: Users,
      color: "from-indexa-mint to-indexa-mint-dark",
      results: ["Personas criadas", "Jornada mapeada", "Insights validados"]
    },
    {
      letter: "C",
      title: "Concept",
      subtitle: "Conceito Criativo",
      description: "Desenvolvemos conceitos criativos únicos que conectam sua marca com a audiência de forma autêntica.",
      icon: Lightbulb,
      color: "from-indexa-purple-light to-indexa-purple",
      results: ["Conceito único", "Narrativa definida", "Visual identity"]
    },
    {
      letter: "C",
      title: "Creation",
      subtitle: "Produção Executiva",
      description: "Executamos a produção com excelência técnica, utilizando equipamentos de ponta e equipe especializada.",
      icon: Cog,
      color: "from-indexa-mint-light to-indexa-mint",
      results: ["Produção premium", "Qualidade 4K+", "Entrega pontual"]
    },
    {
      letter: "O",
      title: "Optimization",
      subtitle: "Otimização Contínua",
      description: "Analisamos performance e otimizamos conteúdos para maximizar engajamento e conversão.",
      icon: Trophy,
      color: "from-indexa-purple-dark to-indexa-purple-light",
      results: ["Performance acompanhada", "Ajustes realizados", "ROI otimizado"]
    },
    {
      letter: "H",
      title: "Heart",
      subtitle: "Conexão Emocional",
      description: "Garantimos que cada produção gere conexão emocional genuína entre sua marca e audiência.",
      icon: Heart,
      color: "from-indexa-mint to-indexa-purple",
      results: ["Emoção gerada", "Conexão criada", "Marca fortalecida"]
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-indexa-purple/5 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-mint/10 text-indexa-purple px-6 py-3 rounded-full text-sm font-bold mb-6">
            <Trophy className="w-5 h-5" />
            Método T.A.C.C.O.H. na Produção
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Nossa Metodologia
            <span className="block bg-gradient-to-r from-indexa-purple to-indexa-mint bg-clip-text text-transparent">
              Estratégica e Comprovada
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Aplicamos o método T.A.C.C.O.H. em cada produção, garantindo que seus vídeos não sejam apenas bonitos, mas estratégicos e eficazes.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps Visualization */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="space-y-4">
              {taccohSteps.map((step, index) => (
                <div
                  key={index}
                  className={`group cursor-pointer transition-all duration-500 ${
                    activeStep === index ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className={`p-6 rounded-2xl bg-gradient-to-r ${step.color} ${
                    activeStep === index ? 'shadow-enhanced' : 'opacity-70 hover:opacity-90'
                  } transition-all duration-300`}>
                    <div className="flex items-center gap-4 text-white">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-xl">
                          {step.letter}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{step.title}</h3>
                        <p className="text-white/90 text-sm">{step.subtitle}</p>
                      </div>
                      <ArrowRight className={`w-5 h-5 transition-transform ${
                        activeStep === index ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Step Details */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-white rounded-2xl p-8 shadow-enhanced border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${taccohSteps[activeStep].color}`}>
                  {React.createElement(taccohSteps[activeStep].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {taccohSteps[activeStep].title}
                  </h3>
                  <p className="text-indexa-purple font-medium">
                    {taccohSteps[activeStep].subtitle}
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                {taccohSteps[activeStep].description}
              </p>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Resultados Entregues:</h4>
                {taccohSteps[activeStep].results.map((result, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indexa-mint rounded-full"></div>
                    <span className="text-gray-700">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Showcase */}
        <div className={`mt-16 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-indexa-purple to-indexa-purple-dark rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Resultados Comprovados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-2">+300%</div>
                <div className="text-white/90">Aumento no Engajamento</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-2">+250%</div>
                <div className="text-white/90">ROI dos Investimentos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-2">98%</div>
                <div className="text-white/90">Satisfação dos Clientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohMethodSection;