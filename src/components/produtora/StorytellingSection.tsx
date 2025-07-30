import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Heart, Target } from 'lucide-react';

const StorytellingSection = () => {
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
      className="min-h-[85vh] sm:min-h-[80vh] md:min-h-[75vh] bg-gradient-to-br from-gray-900 via-indexa-purple-dark to-black flex items-center relative overflow-hidden pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20 md:pb-24"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indexa-mint/20 to-transparent"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-indexa-mint mr-2 sm:mr-3" />
              <span className="font-montserrat text-indexa-mint text-base sm:text-lg font-medium">Foz do Iguaçu</span>
            </div>
            <h2 className="font-playfair text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              Nascida na <span className="text-indexa-mint">Fronteira</span>
            </h2>
          </div>

          {/* Main Story */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
            
            {/* Story Text */}
            <div className="space-y-6 sm:space-y-8 order-2 md:order-1">
              <div className={`transform transition-all duration-1000 delay-300 ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}>
                <p className="font-montserrat text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed">
                  <span className="font-bold text-indexa-mint">A vertente criativa da INDEXA Mídia</span> que transforma conceitos em narrativas visuais impactantes. 
                  Aqui, unimos tecnologia de ponta e criatividade humanizada para criar vídeos profissionais que capturam a essência da sua marca, 
                  engajam o público e impulsionam resultados reais. Seja para comerciais de TV, gravações de cursos, eventos institucionais ou 
                  conteúdos promocionais, nosso estúdio premium é o espaço onde suas histórias ganham forma.
                </p>
              </div>

              <div className={`transform transition-all duration-1000 delay-500 ${
                isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
              }`}>
                <p className="font-montserrat text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
                  Com expertise em produção audiovisual e uma abordagem estratégica, desenvolvemos conteúdos que não apenas comunicam, 
                  mas conectam emocionalmente com seu público, transformando espectadores em clientes e clientes em defensores da sua marca.
                </p>
              </div>

              {/* Icons */}
              <div className={`flex flex-col xs:flex-row space-y-4 xs:space-y-0 xs:space-x-6 lg:space-x-8 transform transition-all duration-1000 delay-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}>
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-indexa-mint" />
                  <span className="font-montserrat text-white/80 text-xs sm:text-sm">Emoção Real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indexa-mint" />
                  <span className="font-montserrat text-white/80 text-xs sm:text-sm">Impacto Garantido</span>
                </div>
              </div>
            </div>

            {/* Visual Element */}
            <div className={`transform transition-all duration-1000 delay-500 order-1 md:order-2 ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}>
              <div className="relative">
                <div className="bg-gradient-to-br from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-indexa-mint/30">
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <h3 className="font-playfair text-lg sm:text-xl lg:text-2xl font-bold text-white">
                      Excelência Criativa
                    </h3>
                    <p className="font-montserrat text-white/70 text-center leading-relaxed text-sm sm:text-base">
                      Tecnologia avançada e criatividade humanizada unidos para criar vídeos que geram resultados reais.
                    </p>
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

export default StorytellingSection;