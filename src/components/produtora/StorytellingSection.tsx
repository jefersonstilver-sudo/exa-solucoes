import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Heart, Zap } from 'lucide-react';

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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="h-[80vh] bg-gradient-to-br from-gray-900 to-indexa-purple-dark px-4 flex items-center"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Storytelling Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Lado esquerdo - Texto emocional */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 mb-6">
                <MapPin className="w-8 h-8 text-indexa-mint" />
                <span className="text-indexa-mint font-semibold text-lg">Foz do Iguaçu</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                <span className="block mb-4">Nascida na</span>
                <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent mb-4">
                  Fronteira das Águas
                </span>
              </h2>
              
              <div className="space-y-6">
                <p className="text-xl text-white/90 leading-relaxed">
                  <span className="text-indexa-mint font-semibold">A Indexa Produtora existe para superar dores como conteúdos planos que não conectam</span>, criando vídeos que evocam emoções reais e transformam desafios em oportunidades de crescimento.
                </p>
                
                <p className="text-lg text-white/80 leading-relaxed">
                  Aqui, onde três países se encontram, entendemos a força da <span className="text-white font-semibold">convergência de culturas e ideias</span>. Nossa produtora carrega essa energia única - a capacidade de unir diferentes perspectivas em narrativas que <span className="text-indexa-mint font-semibold">realmente impactam</span>.
                </p>
                
                <p className="text-lg text-white/80 leading-relaxed">
                  Cada projeto é uma jornada cinematográfica que vai além do convencional, criando <span className="text-indexa-mint font-semibold">conexões autênticas entre marcas e pessoas</span>.
                </p>
              </div>
            </div>

            {/* Lado direito - Elementos visuais */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                {/* Card 1 */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105">
                  <Heart className="w-8 h-8 text-indexa-mint mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Emoção Real</h3>
                  <p className="text-white/80 text-sm">Vídeos que fazem sentir, não apenas ver</p>
                </div>
                
                {/* Card 2 */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 mt-8">
                  <Zap className="w-8 h-8 text-indexa-mint mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Impacto Transformador</h3>
                  <p className="text-white/80 text-sm">Narrativas que geram resultados reais</p>
                </div>
              </div>
              
              {/* Elemento decorativo - representando as águas de Foz */}
              <div className="absolute inset-0 bg-gradient-to-t from-indexa-mint/10 via-transparent to-transparent rounded-2xl blur-xl opacity-50 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorytellingSection;