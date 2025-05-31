
import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Clock, BarChart3 } from 'lucide-react';

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      icon: Search,
      title: 'Escolha os prédios e plano',
      description: 'Selecione localizações estratégicas e o plano ideal para seu negócio',
      details: 'Nossa plataforma permite escolher especificamente quais prédios e regiões você quer atingir'
    },
    {
      icon: Upload,
      title: 'Envie seu vídeo',
      description: 'Upload do seu material ou criamos um vídeo profissional para você',
      details: 'Suporte completo para criação de conteúdo otimizado para painéis digitais'
    },
    {
      icon: Clock,
      title: 'Publicação em até 24h',
      description: 'Aprovação rápida e ativação automática nos painéis selecionados',
      details: 'Sistema automatizado garante que sua campanha entre no ar rapidamente'
    },
    {
      icon: BarChart3,
      title: 'Relatório de resultado',
      description: 'Acompanhe exibições, horários de pico e métricas detalhadas',
      details: 'Dashboard completo com analytics em tempo real e insights de performance'
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

  // Auto-cycle through steps
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, steps.length]);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-20 px-4 snap-start"
      id="how-it-works-section"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>

          {/* Timeline Horizontal */}
          <div className="relative">
            {/* Linha conectora */}
            <div className="hidden md:block absolute top-20 left-0 w-full h-1 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-indexa-purple to-indexa-mint transition-all duration-1000"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index <= activeStep;
                
                return (
                  <div
                    key={index}
                    className={`relative transform transition-all duration-700 ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    } ${isActive ? 'scale-105' : 'scale-100'}`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                    onMouseEnter={() => setActiveStep(index)}
                  >
                    {/* Número do step */}
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      isActive 
                        ? 'bg-indexa-mint text-indexa-purple-dark scale-110' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Card do step */}
                    <div className={`bg-white/5 backdrop-blur-sm p-6 rounded-xl border transition-all duration-500 ${
                      isActive 
                        ? 'border-indexa-mint/50 shadow-2xl shadow-indexa-mint/20' 
                        : 'border-white/10 hover:border-white/20'
                    }`}>
                      {/* Ícone */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto transition-all duration-500 ${
                        isActive 
                          ? 'bg-gradient-to-br from-indexa-purple to-indexa-mint scale-110' 
                          : 'bg-white/10'
                      }`}>
                        <IconComponent className={`w-8 h-8 transition-colors duration-500 ${
                          isActive ? 'text-white' : 'text-white/70'
                        }`} />
                      </div>

                      {/* Título */}
                      <h3 className={`text-lg font-bold text-center mb-3 transition-colors duration-500 ${
                        isActive ? 'text-indexa-mint' : 'text-white'
                      }`}>
                        {step.title}
                      </h3>

                      {/* Descrição */}
                      <p className={`text-center text-sm leading-relaxed transition-colors duration-500 ${
                        isActive ? 'text-white' : 'text-white/70'
                      }`}>
                        {step.description}
                      </p>

                      {/* Detalhes expandidos */}
                      <div className={`mt-4 overflow-hidden transition-all duration-500 ${
                        isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <p className="text-indexa-mint/80 text-xs text-center leading-relaxed">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores de progresso mobile */}
          <div className="md:hidden flex justify-center mt-8 space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index <= activeStep 
                    ? 'bg-indexa-mint scale-125' 
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
