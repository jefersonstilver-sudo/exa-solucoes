
import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, CheckCircle, BarChart3 } from 'lucide-react';

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      icon: Search,
      title: 'Escolha os prédios na loja',
      description: 'Selecione localizações estratégicas na nossa plataforma online',
      details: 'Navegue pelo mapa interativo, veja fotos dos prédios e escolha os locais ideais para sua campanha',
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: Upload,
      title: 'Envie seu vídeo ou criamos para você',
      description: 'Upload do material ou serviço de criação profissional',
      details: 'Formatos aceitos: MP4, MOV. Ou nossa equipe cria um vídeo profissional seguindo sua identidade visual',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: CheckCircle,
      title: 'Validamos e ativamos nos painéis',
      description: 'Aprovação rápida e ativação automática',
      details: 'Nossa equipe valida o conteúdo em até 24h e ativa automaticamente nos painéis selecionados',
      color: 'from-purple-500 to-purple-700'
    },
    {
      icon: BarChart3,
      title: 'Acompanhe os relatórios de impacto',
      description: 'Métricas detalhadas e insights de performance',
      details: 'Dashboard completo com número de exibições, horários de pico e relatórios de engajamento',
      color: 'from-orange-500 to-red-500'
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

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, steps.length]);

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-white/80 mb-16 text-center max-w-4xl mx-auto">
            Processo simples e eficiente em 4 etapas
          </p>

          <div className="hidden md:block relative mb-16">
            <div className="absolute top-20 left-0 w-full h-1 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-indexa-purple to-indexa-mint transition-all duration-1000"
                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index <= activeStep;
                
                return (
                  <div
                    key={index}
                    className={`relative transform transition-all duration-500 ${
                      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    } ${isActive ? 'scale-105' : 'scale-100'}`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                    onMouseEnter={() => setActiveStep(index)}
                  >
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-indexa-mint text-indexa-purple-dark scale-110' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>

                    <div className={`bg-gradient-to-br ${step.color} rounded-xl p-6 transition-all duration-300 ${
                      isActive 
                        ? 'shadow-xl shadow-indexa-mint/20 border border-indexa-mint/50' 
                        : 'hover:shadow-lg'
                    }`}>
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 mx-auto transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/30 scale-110' 
                          : 'bg-white/20'
                      }`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-lg font-bold text-center mb-3 text-white">
                        {step.title}
                      </h3>

                      <p className="text-white/90 text-center text-sm mb-3">
                        {step.description}
                      </p>

                      <div className={`overflow-hidden transition-all duration-300 ${
                        isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <p className="text-white/80 text-xs text-center">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${activeStep * 100}%)` }}>
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  
                  return (
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <div className={`bg-gradient-to-br ${step.color} rounded-xl p-6`}>
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-center mb-3 text-white">
                          {step.title}
                        </h3>
                        <p className="text-white/90 text-center text-sm mb-3">
                          {step.description}
                        </p>
                        <p className="text-white/80 text-xs text-center">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === activeStep 
                      ? 'bg-indexa-mint scale-125' 
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
