import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sparkles, ArrowRight } from 'lucide-react';

const CTAFinalSection = () => {
  const [isVisible, setIsVisible] = useState(false);
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

  const scrollToBriefing = () => {
    const briefingSection = document.querySelector('[id*="briefing"], [class*="briefing"]');
    briefingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-[60vh] sm:min-h-[50vh] md:h-[40vh] bg-gradient-to-br from-indexa-purple via-indexa-purple-dark to-black flex items-center relative overflow-hidden py-12 sm:py-16 md:py-0"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indexa-mint/10 via-transparent to-indexa-mint/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(88,227,171,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(88,227,171,0.1),transparent_50%)]"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          
          {/* Icon Animation */}
          <div className={`transform transition-all duration-1000 delay-200 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indexa-mint to-white rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-indexa-purple animate-pulse" />
            </div>
          </div>

          {/* Main CTA Text */}
          <div className={`transform transition-all duration-1000 delay-400 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <h2 className="font-playfair text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              <span className="block mb-1 sm:mb-2">Sinta a</span>
              <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
                Transformação
              </span>
            </h2>
            
            <p className="font-montserrat text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Agende uma reunião gratuita e descubra como elevar sua marca a alturas cinematográficas
            </p>
          </div>

          {/* CTA Button */}
          <div className={`transform transition-all duration-1000 delay-600 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
            <button
              onClick={scrollToBriefing}
              className="group bg-gradient-to-r from-indexa-mint to-white text-indexa-purple font-bold py-3 sm:py-4 lg:py-6 px-6 sm:px-8 lg:px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-110 hover:-translate-y-2 font-montserrat text-sm sm:text-base lg:text-lg mx-auto"
            >
              <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap">Agendar Reunião Gratuita</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </button>
          </div>

          {/* Subtitle */}
          <div className={`transform transition-all duration-1000 delay-800 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <p className="font-montserrat text-white/70 text-xs sm:text-sm mt-4 sm:mt-6 px-4">
              ✨ Sem compromisso • 🎬 Análise personalizada • 🚀 Resultados garantidos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTAFinalSection;