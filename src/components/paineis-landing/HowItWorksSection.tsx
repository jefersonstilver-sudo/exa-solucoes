
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Settings, Monitor, BarChart3 } from 'lucide-react';

const HowItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const steps = [
    {
      icon: Upload,
      title: 'Envie seu Vídeo',
      description: 'Faça upload do seu conteúdo de 15 segundos ou nossa equipe cria para você',
      detail: 'Formatos aceitos: MP4, MOV, AVI. Resolução: 1080x1920 (vertical). Nossa equipe revisa e otimiza automaticamente.'
    },
    {
      icon: Settings,
      title: 'Configure a Campanha',
      description: 'Escolha prédios, horários e duração da exibição',
      detail: 'Selecione por bairro, perfil demográfico ou endereços específicos. Defina horários de maior impacto para seu público.'
    },
    {
      icon: Monitor,
      title: 'Aprovação e Ativação',
      description: 'Revisamos o conteúdo e ativamos em até 24 horas',
      detail: 'Verificamos qualidade, adequação ao público e conformidade. Você recebe notificação quando tudo estiver ativo.'
    },
    {
      icon: BarChart3,
      title: 'Acompanhe Resultados',
      description: 'Dashboard em tempo real com métricas detalhadas',
      detail: 'Visualizações, horários de pico, QR codes escaneados e engagement por localização. Otimize sua estratégia constantemente.'
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

  // Auto-cycle através dos steps
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
      className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center py-16 sm:py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-gray-900 bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-12 sm:mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Processo simples e rápido para sua marca estar nos elevadores
          </p>

          {/* Timeline Responsiva */}
          <div className="relative">
            {/* Linha conectora - apenas desktop */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-indexa-mint to-indexa-purple" />

            {/* Grid de Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === activeStep;
                
                return (
                  <div
                    key={index}
                    className={`relative transform transition-all duration-700 cursor-pointer ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    } ${isActive ? 'scale-105' : 'hover:scale-102'}`}
                    style={{ transitionDelay: `${index * 200}ms` }}
                    onClick={() => setActiveStep(index)}
                  >
                    {/* Step Card */}
                    <div className={`relative bg-white p-6 sm:p-8 rounded-2xl border transition-all duration-500 shadow-lg ${
                      isActive 
                        ? 'border-indexa-mint/60 shadow-2xl shadow-indexa-mint/20' 
                        : 'border-gray-200 hover:border-indexa-mint/30'
                    }`}>
                      
                      {/* Número do Step */}
                      <div className={`absolute -top-4 left-6 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                        isActive 
                          ? 'bg-indexa-mint text-white scale-110' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>

                      {/* Ícone */}
                      <div className={`w-16 h-16 mx-auto mb-4 sm:mb-6 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isActive 
                          ? 'bg-indexa-mint/20 scale-110' 
                          : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-8 h-8 transition-colors duration-500 ${
                          isActive ? 'text-indexa-mint' : 'text-gray-600'
                        }`} />
                      </div>

                      {/* Título */}
                      <h3 className={`text-lg sm:text-xl font-bold text-center mb-3 sm:mb-4 transition-colors duration-500 ${
                        isActive ? 'text-indexa-mint' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </h3>

                      {/* Descrição */}
                      <p className="text-gray-700 text-center text-sm sm:text-base mb-4">
                        {step.description}
                      </p>

                      {/* Detalhes expandidos */}
                      <div className={`overflow-hidden transition-all duration-500 ${
                        isActive ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="border-t border-indexa-mint/30 pt-4">
                          <p className="text-gray-600 text-xs sm:text-sm text-center leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>

                      {/* Indicador de progresso */}
                      <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-500 ${
                        isActive ? 'bg-indexa-mint w-16' : 'bg-gray-300'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Indicadores de progresso mobile */}
            <div className="flex justify-center mt-8 sm:mt-12 space-x-2 sm:space-x-3 lg:hidden">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                    index === activeStep 
                      ? 'bg-indexa-mint scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA motivacional */}
          <div className="text-center mt-12 sm:mt-16">
            <div className="bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/10 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 max-w-3xl mx-auto shadow-lg">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                <span className="text-indexa-mint">Processo completo:</span> Da criação aos resultados em 48h
              </p>
              <p className="text-gray-700 text-base sm:text-lg">
                Nossa equipe cuida de tudo para sua campanha ser um sucesso
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
