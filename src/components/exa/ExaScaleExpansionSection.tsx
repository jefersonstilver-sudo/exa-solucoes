import React, { useEffect, useState, useRef } from 'react';
import { Building2, MapPin, TrendingUp } from 'lucide-react';

const ExaScaleExpansionSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setAnimateProgress(true), 500);
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
    if (animateProgress) {
      const interval = setInterval(() => {
        setCurrentCount(prev => {
          if (prev < 50) return prev + 1;
          clearInterval(interval);
          return 50;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [animateProgress]);

  return (
    <section 
      ref={sectionRef}
      className="bg-slate-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-6 sm:mb-8 leading-tight tracking-wide">
            Escala Atual e Expansão
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
          {/* Progress Section */}
          <div className={`space-y-8 sm:space-y-10 lg:space-y-12 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            {/* Current Phase */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-4">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-exo-2 font-bold text-slate-800 tracking-wide">
                    Fase 1 - Foz do Iguaçu
                  </h3>
                  <p className="text-slate-600 font-exo-2 font-light text-sm sm:text-base md:text-lg">
                    Prédios residenciais premium
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-black text-purple-600">
                    {currentCount}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-exo-2 font-medium text-slate-600">
                    Instalação em andamento
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1500 ease-out"
                    style={{ width: animateProgress ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Expansion Phase */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-exo-2 font-bold text-slate-800 tracking-wide">
                    Fase 2 - Expansão
                  </h3>
                  <p className="text-slate-600 font-exo-2 font-light text-sm sm:text-base md:text-lg">
                    Novos prédios planejados
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-slate-200">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base md:text-lg font-exo-2 font-medium text-slate-600">
                      Outros 50 prédios
                    </span>
                    <span className="text-xs sm:text-sm text-indigo-600 font-medium">
                      Em planejamento
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 sm:h-4 mt-4 sm:mt-6">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1500 ease-out delay-500"
                    style={{ width: animateProgress ? '30%' : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className={`space-y-6 sm:space-y-8 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
              <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mb-4 sm:mb-6 text-purple-200" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-exo-2 font-bold mb-4 sm:mb-6 leading-tight tracking-wide">
                Maior sistema de mídia inteligente da região
              </h3>
              <div className="space-y-4 sm:space-y-6 font-exo-2 font-light text-white/90 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed tracking-wide">
                <p>
                  A Fase 1 da EXA já está em curso com 50 prédios residenciais premium em Foz do Iguaçu.
                </p>
                <p>
                  A cada novo prédio, a audiência cresce — e a densidade da presença da sua marca aumenta.
                </p>
                <p>
                  Com mais 50 novos prédios planejados, a EXA se consolida como o maior sistema de mídia inteligente da região.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaScaleExpansionSection;