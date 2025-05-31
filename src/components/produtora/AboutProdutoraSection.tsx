
import React, { useState, useEffect, useRef } from 'react';
import { Video, Heart, Zap, Award } from 'lucide-react';

const AboutProdutoraSection = () => {
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

  const highlights = [
    {
      icon: Video,
      title: 'Criação Completa',
      description: 'Institucional, publicitário, reels, entrevistas, comerciais, YouTube e documentais.'
    },
    {
      icon: Zap,
      title: 'Formato Vertical',
      description: 'Especialistas em formatos verticais de alta performance para redes sociais.'
    },
    {
      icon: Heart,
      title: 'Experiência Multisensorial',
      description: 'Do roteiro à entrega, cada projeto é uma jornada emocional completa.'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-900 to-indexa-purple-dark px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
                Sobre a Indexa Produtora
              </span>
            </h2>
          </div>

          {/* Storytelling principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div className="space-y-6">
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
                A Indexa é <span className="text-indexa-mint font-semibold">mais que uma produtora</span>. 
                É um núcleo criativo com alma cinematográfica.
              </p>
              
              <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
                Nosso estúdio não só grava vídeos. Ele <span className="text-white font-semibold">transforma ideias em movimento</span>. 
                Usamos estrutura técnica de alto nível com uma equipe apaixonada por narrativa, marketing e emoção.
              </p>
              
              <p className="text-lg sm:text-xl text-white/80 leading-relaxed">
                Nossa entrega é de <span className="text-indexa-mint font-semibold">performance, estética e impacto</span>.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center shadow-2xl">
                  <Award className="w-16 h-16 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indexa-mint/20 to-indexa-purple/20 rounded-full blur-xl opacity-70" />
              </div>
            </div>
          </div>

          {/* Destaques em cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {highlights.map((highlight, index) => {
              const IconComponent = highlight.icon;
              return (
                <div
                  key={index}
                  className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 transform ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="w-12 h-12 bg-indexa-mint/20 rounded-full flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-indexa-mint" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{highlight.title}</h3>
                  <p className="text-white/80 leading-relaxed">{highlight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutProdutoraSection;
