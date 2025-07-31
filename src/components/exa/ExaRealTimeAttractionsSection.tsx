import React, { useEffect, useState, useRef } from 'react';
import { Camera, TrendingUp, Newspaper, Bell } from 'lucide-react';

const ExaRealTimeAttractionsSection: React.FC = () => {
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

  const attractions = [
    {
      icon: Camera,
      title: "Câmeras ao vivo",
      items: [
        "Ponte da Amizade (BR–PY)",
        "Ponte da Integração (aprovada)",
        "Ponte da Argentina (em aprovação)"
      ]
    },
    {
      icon: TrendingUp,
      title: "Cotações atualizadas em tempo real",
      items: [
        "Dólar, Euro, Peso, Guarani",
        "Cripto, Bolsa Global"
      ]
    },
    {
      icon: Newspaper,
      title: "Notícias locais e globais",
      items: [
        "Sempre atualizadas e visivelmente úteis"
      ]
    },
    {
      icon: Bell,
      title: "Avisos do síndico integrados ao painel",
      items: [
        "Canal oficial de comunicação",
        "entre gestão e morador"
      ]
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="bg-gradient-to-br from-indigo-900 via-purple-800 to-purple-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-400 bg-clip-text mb-6 sm:mb-8 leading-tight tracking-wide">
            O painel da EXA prende atenção com conteúdo vivo
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl font-exo-2 font-light text-white/80 max-w-3xl mx-auto leading-relaxed tracking-wide">
            e sua marca surfa junto nessa onda.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {attractions.map((attraction, index) => {
            const Icon = attraction.icon;
            return (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 sm:p-8 lg:p-10 border border-white/20 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-102 group breathing-effect ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  animation: isVisible ? `breathing 3s ease-in-out infinite ${index * 0.5}s` : 'none'
                }}
              >
                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="flex-shrink-0">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-200 transition-transform duration-300 group-hover:rotate-360" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-exo-2 font-bold text-white mb-4 sm:mb-6 leading-tight tracking-wide">
                      {attraction.title}
                    </h3>
                    <ul className="space-y-2 sm:space-y-3">
                      {attraction.items.map((item, itemIndex) => (
                        <li 
                          key={itemIndex}
                          className="font-exo-2 font-light text-white/90 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed tracking-wide flex items-center"
                        >
                          <div className="w-2 h-2 bg-purple-300 rounded-full mr-3 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className={`text-center mt-12 sm:mt-16 lg:mt-20 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="font-exo-2 font-light text-white/70 text-sm sm:text-base md:text-lg lg:text-xl max-w-4xl mx-auto leading-relaxed tracking-wide italic">
            Esses elementos são pensados para atrair diferentes perfis de atenção — o curioso, o informado, o ansioso — enquanto a sua marca aparece de forma integrada, frequente e contextual.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </section>
  );
};

export default ExaRealTimeAttractionsSection;