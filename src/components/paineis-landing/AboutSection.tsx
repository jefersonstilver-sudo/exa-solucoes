
import React, { useState, useEffect, useRef } from 'react';

const AboutSection = () => {
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

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-white flex items-center justify-center py-20 px-4 snap-start"
      id="about-section"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <h2 className="text-5xl md:text-6xl font-bold text-indexa-purple mb-12 leading-tight">
            O que são os
            <span className="block bg-gradient-to-r from-indexa-purple to-indexa-mint bg-clip-text text-transparent">
              Painéis Indexa?
            </span>
          </h2>

          {/* Conteúdo principal */}
          <div className="space-y-8">
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-light">
              Transformamos elevadores em canais de mídia digital.
            </p>
            
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Nossos painéis exibem vídeos, cotações, clima, trânsito e sua marca — 
              direto nos condomínios mais valiosos da cidade.
            </p>

            {/* Elementos visuais decorativos */}
            <div className="flex justify-center items-center space-x-6 mt-12">
              <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-indexa-purple rounded-full animate-pulse delay-200" />
              <div className="w-2 h-2 bg-indexa-mint rounded-full animate-pulse delay-400" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
