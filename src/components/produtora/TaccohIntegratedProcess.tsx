import React, { useState, useEffect, useRef } from 'react';
import { Target, Users, Coffee, Clapperboard, Heart, Lightbulb, PlayCircle, CheckCircle } from 'lucide-react';

const TaccohIntegratedProcess = () => {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const taccohSteps = [
    {
      letter: 'T',
      icon: Target,
      title: 'TARGET',
      subtitle: 'Definição Estratégica',
      description: 'Identificamos com precisão o público-alvo e objetivos da produção',
      details: [
        'Análise profunda do público-alvo',
        'Definição de objetivos específicos',
        'Mapeamento da jornada do cliente',
        'Análise de concorrência e mercado'
      ],
      studioActions: [
        'Briefing estratégico no estúdio',
        'Configuração de cenários adequados',
        'Preparação de equipamentos específicos'
      ],
      duration: '2-3 horas',
      color: 'red'
    },
    {
      letter: 'A',
      icon: Users,
      title: 'AUDIENCE',
      subtitle: 'Conexão Emocional',
      description: 'Criamos conexão genuína entre marca e audiência através de narrativas autênticas',
      details: [
        'Personas detalhadas da audiência',
        'Mapeamento de dores e desejos',
        'Linguagem e tom de voz adequados',
        'Canais de distribuição otimizados'
      ],
      studioActions: [
        'Cenários que refletem o universo da audiência',
        'Iluminação que transmite emoção',
        'Captação de múltiplos ângulos'
      ],
      duration: '1-2 horas',
      color: 'blue'
    },
    {
      letter: 'C',
      icon: Coffee,
      title: 'COFFEE',
      subtitle: 'Humanização Autêntica',
      description: 'Trazemos naturalidade e humanização para criar conteúdo autêntico',
      details: [
        'Conversas naturais e espontâneas',
        'Storytelling humanizado',
        'Remoção de barreiras formais',
        'Conexão genuína com a câmera'
      ],
      studioActions: [
        'Ambiente acolhedor e relaxante',
        'Teleprompter para naturalidade',
        'Múltiplas takes para espontaneidade'
      ],
      duration: '3-4 horas',
      color: 'yellow'
    },
    {
      letter: 'C',
      icon: Clapperboard,
      title: 'CONTENT',
      subtitle: 'Produção Cinematográfica',
      description: 'Desenvolvemos conteúdo visual e narrativo de alta qualidade',
      details: [
        'Roteirização estratégica',
        'Direção de fotografia cinematográfica',
        'Captação em múltiplos formatos',
        'Qualidade técnica profissional'
      ],
      studioActions: [
        'Filmagem com câmeras 6K/8K',
        'Chroma key para cenários virtuais',
        'Iluminação cinematográfica profissional'
      ],
      duration: '4-8 horas',
      color: 'green'
    },
    {
      letter: 'O',
      icon: Heart,
      title: 'OUTCOME',
      subtitle: 'Resultados Mensuráveis',
      description: 'Focamos em resultados concretos e métricas de performance',
      details: [
        'KPIs definidos previamente',
        'Métricas de engajamento',
        'ROI mensurável',
        'Análise de performance contínua'
      ],
      studioActions: [
        'Edição focada em conversão',
        'Versões otimizadas por plataforma',
        'Call-to-actions estratégicos'
      ],
      duration: '24-48 horas',
      color: 'purple'
    },
    {
      letter: 'H',
      icon: Lightbulb,
      title: 'HUMAN',
      subtitle: 'Toque Humano Final',
      description: 'Garantimos que cada vídeo tenha alma e conecte emocionalmente',
      details: [
        'Revisão emocional do conteúdo',
        'Ajustes de tom e personalidade',
        'Testes com audiência real',
        'Refinamento baseado em feedback'
      ],
      studioActions: [
        'Color grading emocional',
        'Mixagem de áudio envolvente',
        'Finalização com identidade única'
      ],
      duration: '12-24 horas',
      color: 'pink'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % taccohSteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [taccohSteps.length]);

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      red: isActive ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/20 text-red-400 border-red-500/30',
      blue: isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      yellow: isActive ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      green: isActive ? 'bg-green-500 text-white border-green-500' : 'bg-green-500/20 text-green-400 border-green-500/30',
      purple: isActive ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pink: isActive ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-white to-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-full px-6 py-2 mb-8">
              <PlayCircle className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-purple-600 font-bold text-sm tracking-wide">MÉTODO T.A.C.C.O.H.</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              PROCESSO INTEGRADO
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ESTÚDIO + T.A.C.C.O.H.
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Nosso método estratégico integrado à infraestrutura cinematográfica para 
              resultados excepcionais em cada produção
            </p>
          </div>

          {/* Timeline visual */}
          <div className="relative mb-16">
            {/* Linha conectora */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-pink-500 opacity-30" />
            
            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              {taccohSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === activeStep;
                
                return (
                  <div
                    key={index}
                    className={`group cursor-pointer transition-all duration-500 ${
                      isActive ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setActiveStep(index)}
                  >
                    {/* Letter circle */}
                    <div className="relative text-center mb-6">
                      <div className={`w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center font-black text-2xl transition-all duration-500 ${
                        getColorClasses(step.color, isActive)
                      }`}>
                        {step.letter}
                      </div>
                      
                      {/* Connector dot */}
                      <div className={`hidden lg:block absolute top-1/2 -right-8 w-4 h-4 rounded-full transform -translate-y-1/2 transition-all duration-500 ${
                        isActive ? 'bg-gray-800 scale-125' : 'bg-gray-400'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        getColorClasses(step.color, false)
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      
                      <h3 className={`font-bold text-lg mb-1 transition-colors duration-300 ${
                        isActive ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-2">{step.subtitle}</p>
                      
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        getColorClasses(step.color, false)
                      }`}>
                        {step.duration}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalhes do step ativo */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lado esquerdo - Estratégia */}
              <div>
                <div className={`inline-flex items-center rounded-full px-4 py-2 mb-4 ${
                  getColorClasses(taccohSteps[activeStep].color, false)
                }`}>
                  <span className="font-bold text-sm">ESTRATÉGIA</span>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {taccohSteps[activeStep].title} - {taccohSteps[activeStep].subtitle}
                </h3>
                
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  {taccohSteps[activeStep].description}
                </p>

                <div className="space-y-3">
                  {taccohSteps[activeStep].details.map((detail, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lado direito - Execução no Estúdio */}
              <div>
                <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-6 text-white">
                  <div className="inline-flex items-center bg-yellow-400/20 border border-yellow-400/30 rounded-full px-4 py-2 mb-4">
                    <span className="text-yellow-400 font-bold text-sm">EXECUÇÃO NO ESTÚDIO</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-4">
                    Como aplicamos no nosso Super Estúdio:
                  </h4>

                  <div className="space-y-4">
                    {taccohSteps[activeStep].studioActions.map((action, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-300">{action}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                    <div className="text-yellow-400 font-bold text-sm mb-1">TEMPO DE EXECUÇÃO</div>
                    <div className="text-white font-bold">{taccohSteps[activeStep].duration}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA final */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-2xl">
              <div className="bg-white px-8 py-4 rounded-xl">
                <p className="text-xl font-bold text-gray-900">
                  Estratégia + Estúdio = <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Resultados Extraordinários</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaccohIntegratedProcess;