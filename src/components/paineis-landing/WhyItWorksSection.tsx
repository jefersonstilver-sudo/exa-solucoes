
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Clock, Target, TrendingUp } from 'lucide-react';

const WhyItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const reasons = [
    {
      icon: Eye,
      title: 'Atenção Cativa',
      number: '100%',
      description: 'Público não pode "pular" ou ignorar',
      detail: 'Durante a espera e trajeto no elevador, seu público está 100% focado na tela'
    },
    {
      icon: Clock,
      title: 'Tempo de Exposição',
      number: '60s',
      description: 'Visualização completa garantida',
      detail: 'Entre espera e trajeto, cada pessoa assiste seu anúncio por até 60 segundos'
    },
    {
      icon: Target,
      title: 'Repetição Estratégica',
      number: '4x',
      description: 'Múltiplas visualizações por dia',
      detail: 'Moradores veem sua marca 4x ao dia, visitantes e funcionários também'
    },
    {
      icon: TrendingUp,
      title: 'Recall de Marca',
      number: '245x',
      description: 'Exibições diárias por painel',
      detail: 'Alta frequência gera lembrança e reconhecimento instantâneo da marca'
    }
  ];

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

  // Auto-cycle através dos reasons
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % reasons.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, reasons.length]);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-16 sm:py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Por que funciona tanto?
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-white/80 mb-12 sm:mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Ciência por trás da efetividade dos painéis em elevadores
          </p>

          {/* Grid de Razões - RESPONSIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {reasons.map((reason, index) => {
              const IconComponent = reason.icon;
              const isActive = index === activeStep;
              
              return (
                <div
                  key={index}
                  className={`group relative transform transition-all duration-700 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${isActive ? 'scale-105' : 'hover:scale-102'}`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Card Principal */}
                  <div className={`relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border transition-all duration-500 ${
                    isActive 
                      ? 'border-indexa-mint/60 shadow-2xl shadow-indexa-mint/20' 
                      : 'border-white/10 hover:border-indexa-mint/30'
                  }`}>
                    
                    {/* Número destacado */}
                    <div className={`text-center mb-4 sm:mb-6 transition-all duration-500 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}>
                      <div className={`text-4xl sm:text-6xl font-bold mb-2 transition-colors duration-500 ${
                        isActive ? 'text-indexa-mint' : 'text-white'
                      }`}>
                        {reason.number}
                      </div>
                      
                      {/* Ícone */}
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive 
                          ? 'bg-indexa-mint/20 scale-110' 
                          : 'bg-white/10'
                      }`}>
                        <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-500 ${
                          isActive ? 'text-indexa-mint' : 'text-white'
                        }`} />
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className={`text-lg sm:text-xl font-bold text-center mb-2 sm:mb-3 transition-colors duration-500 ${
                      isActive ? 'text-indexa-mint' : 'text-white'
                    }`}>
                      {reason.title}
                    </h3>

                    {/* Descrição */}
                    <p className="text-white/90 text-center text-sm sm:text-base mb-3 sm:mb-4">
                      {reason.description}
                    </p>

                    {/* Detalhes expandidos */}
                    <div className={`overflow-hidden transition-all duration-500 ${
                      isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-indexa-mint/30 pt-3 sm:pt-4">
                        <p className="text-white/80 text-xs sm:text-sm text-center leading-relaxed">
                          {reason.detail}
                        </p>
                      </div>
                    </div>

                    {/* Indicador de atividade */}
                    <div className={`absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-indexa-mint w-12' : 'bg-white/30'
                    }`} />

                    {/* Efeito de brilho */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-indexa-mint/5 to-transparent transform -skew-x-12 transition-transform duration-1000 rounded-2xl ${
                      isActive ? 'translate-x-full' : '-translate-x-full'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicadores de progresso - RESPONSIVO */}
          <div className="flex justify-center mt-8 sm:mt-12 space-x-2 sm:space-x-3">
            {reasons.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                  index === activeStep 
                    ? 'bg-indexa-mint scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Conclusão motivacional */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-indexa-mint/30 max-w-3xl mx-auto">
              <p className="text-xl sm:text-2xl font-bold text-white mb-2">
                <span className="text-indexa-mint">Resultado:</span> 95% de taxa de atenção
              </p>
              <p className="text-white/80 text-base sm:text-lg">
                Muito superior a qualquer outra mídia digital
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItWorksSection;
