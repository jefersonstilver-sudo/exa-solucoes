import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sparkles } from 'lucide-react';

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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToBriefing = () => {
    const briefingSection = document.getElementById('briefing-section');
    briefingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef}
      className="h-[40vh] bg-gradient-to-br from-indexa-purple-dark via-indexa-purple to-gray-900 px-4 flex items-center relative overflow-hidden"
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/10 via-transparent to-indexa-purple/20 opacity-50" />
      
      <div className="max-w-4xl mx-auto w-full text-center relative z-10">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone central */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-indexa-mint/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indexa-mint" />
              </div>
              <div className="absolute inset-0 bg-indexa-mint/10 rounded-full blur-xl animate-pulse" />
            </div>
          </div>

          {/* Título principal */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            <span className="block">Sinta a</span>
            <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              Transformação
            </span>
          </h2>
          
          {/* Subtítulo */}
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Agende uma reunião gratuita e descubra como elevamos sua marca a alturas cinematográficas
          </p>
          
          {/* CTA Button */}
          <button
            onClick={scrollToBriefing}
            className="group bg-indexa-mint text-indexa-purple-dark font-bold py-6 px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
          >
            <span className="flex items-center space-x-3 text-lg">
              <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Agendar Reunião Gratuita</span>
            </span>
          </button>
          
          {/* Texto adicional */}
          <p className="text-sm text-white/60 mt-4">
            Sem compromisso • Consultoria inicial gratuita • Resultados garantidos
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTAFinalSection;