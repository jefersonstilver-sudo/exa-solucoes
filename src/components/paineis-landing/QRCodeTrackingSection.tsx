
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, BarChart3, MapPin, Clock } from 'lucide-react';

const QRCodeTrackingSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const features = [
    {
      icon: QrCode,
      title: 'QR Code Único',
      description: 'Cada painel tem código exclusivo',
      detail: 'Rastreamento individual por localização para métricas precisas'
    },
    {
      icon: BarChart3,
      title: 'Analytics Detalhado',
      description: 'Relatórios em tempo real',
      detail: 'Visualizações, horários de pico e engajamento por prédio'
    },
    {
      icon: MapPin,
      title: 'Localização Precisa',
      description: 'GPS de cada interação',
      detail: 'Saiba exatamente onde sua marca gera mais impacto'
    },
    {
      icon: Clock,
      title: 'Horários de Pico',
      description: 'Análise temporal completa',
      detail: 'Identifique os melhores momentos para maximizar visualizações'
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

  // Auto-cycle através das features (pausado em mobile para economia de bateria)
  useEffect(() => {
    if (isVisible && window.innerWidth >= 768) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, features.length]);

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
              Rastreabilidade Total
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-12 sm:mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            QR Codes únicos para acompanhar cada interação e otimizar resultados
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Demonstração do QR Code - RESPONSIVA */}
            <div className={`order-2 lg:order-1 transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              <div className="relative bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-indexa-mint/30 shadow-lg">
                {/* QR Code simulado */}
                <div className="bg-white p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 mx-auto w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center border border-gray-200">
                  <div className="grid grid-cols-8 gap-1 w-full h-full">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm ${
                          Math.random() > 0.5 ? 'bg-gray-900' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    QR Code: ED-1205-FZ
                  </h3>
                  <p className="text-indexa-mint text-sm sm:text-base font-medium mb-2">
                    Edifício Premium Tower - 12º andar
                  </p>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Escaneado 147 vezes hoje
                  </p>
                </div>

                {/* Métricas em tempo real */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <div className="bg-gray-900/10 p-3 sm:p-4 rounded-lg text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indexa-mint">95</div>
                    <div className="text-gray-600 text-xs sm:text-sm">Scans hoje</div>
                  </div>
                  <div className="bg-gray-900/10 p-3 sm:p-4 rounded-lg text-center">
                    <div className="text-xl sm:text-2xl font-bold text-indexa-mint">14:30</div>
                    <div className="text-gray-600 text-xs sm:text-sm">Pico de uso</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features de Rastreamento - RESPONSIVAS */}
            <div className={`order-1 lg:order-2 space-y-4 sm:space-y-6 transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}>
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                const isActive = index === activeFeature;
                
                return (
                  <div
                    key={index}
                    className={`group relative p-4 sm:p-6 rounded-xl border transition-all duration-500 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/10 border-indexa-mint/50 scale-105 shadow-lg' 
                        : 'bg-white/70 border-gray-900/10 hover:border-indexa-mint/30'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Ícone */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center transition-all duration-500 ${
                        isActive 
                          ? 'bg-indexa-mint/20 scale-110' 
                          : 'bg-gray-900/10 group-hover:bg-indexa-mint/10'
                      }`}>
                        <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-500 ${
                          isActive ? 'text-indexa-mint' : 'text-gray-900'
                        }`} />
                      </div>

                      <div className="flex-1">
                        {/* Título */}
                        <h3 className={`text-base sm:text-lg font-bold mb-1 sm:mb-2 transition-colors duration-500 ${
                          isActive ? 'text-indexa-mint' : 'text-gray-900'
                        }`}>
                          {feature.title}
                        </h3>

                        {/* Descrição */}
                        <p className="text-gray-700 text-sm sm:text-base mb-2 sm:mb-3">
                          {feature.description}
                        </p>

                        {/* Detalhes expandidos */}
                        <div className={`overflow-hidden transition-all duration-500 ${
                          isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                            {feature.detail}
                          </p>
                        </div>
                      </div>

                      {/* Indicador de status */}
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        isActive ? 'bg-indexa-mint animate-pulse' : 'bg-gray-900/30'
                      }`} />
                    </div>
                  </div>
                );
              })}

              {/* Dashboard Preview */}
              <div className="bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-indexa-mint/30 mt-6 sm:mt-8 shadow-lg">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Dashboard em Tempo Real</h4>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">Total de visualizações</span>
                    <span className="text-indexa-mint font-bold text-sm sm:text-base">2.847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">QR Codes escaneados</span>
                    <span className="text-indexa-mint font-bold text-sm sm:text-base">342</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm sm:text-base">Taxa de engajamento</span>
                    <span className="text-indexa-mint font-bold text-sm sm:text-base">12.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QRCodeTrackingSection;
