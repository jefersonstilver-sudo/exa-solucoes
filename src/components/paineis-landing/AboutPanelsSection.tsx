
import React, { useState, useEffect, useRef } from 'react';
import { Cloud, DollarSign, Bell, Newspaper, Car, Play } from 'lucide-react';

const AboutPanelsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const cards = [
    {
      icon: Cloud,
      title: 'Clima ao Vivo',
      front: 'Previsão do tempo atualizada',
      back: 'Temperatura, umidade e condições climáticas em tempo real para Foz do Iguaçu',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: DollarSign,
      title: 'Cotações do Dólar',
      front: 'Valores atualizados da moeda',
      back: 'Cotação do dólar, peso argentino e guarani paraguaio em tempo real',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Bell,
      title: 'Avisos do Síndico',
      front: 'Comunicados importantes',
      back: 'Informações sobre assembleias, manutenções e avisos gerais do condomínio',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Newspaper,
      title: 'Notícias da Cidade',
      front: 'Informações locais relevantes',
      back: 'Principais acontecimentos de Foz do Iguaçu e região da tríplice fronteira',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Car,
      title: 'Trânsito Ponte da Amizade',
      front: 'Situação da fronteira',
      back: 'Tempo de espera, fluxo de veículos e condições de travessia atualizados',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: Play,
      title: 'Publicidade 15s',
      front: 'Sua marca em destaque',
      back: 'Vídeos comerciais de 15 segundos intercalados com o conteúdo informativo',
      color: 'from-indexa-purple to-indexa-mint'
    }
  ];

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

  const handleCardClick = (index: number) => {
    setFlippedCard(flippedCard === index ? null : index);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 sm:py-16 lg:py-20 px-4 overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto text-center w-full">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              O que são os Painéis da Indexa?
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-4 sm:mb-6 lg:mb-8 max-w-4xl mx-auto leading-relaxed">
            Uma tecnologia de gestão condominial que transforma elevadores em canais de mídia digital altamente visíveis.
          </p>

          <p className="text-sm sm:text-base lg:text-lg text-white/70 mb-8 sm:mb-12 lg:mb-16 max-w-3xl mx-auto leading-relaxed">
            Nossos painéis inteligentes informam os moradores com conteúdo útil e relevante, 
            intercalando essas informações com sua publicidade de forma estratégica e não invasiva.
          </p>

          {/* Grid de Cards Interativos com Flip - RESPONSIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 w-full">
            {cards.map((card, index) => {
              const IconComponent = card.icon;
              const isFlipped = flippedCard === index;
              
              return (
                <div
                  key={index}
                  className={`relative h-48 sm:h-56 lg:h-64 cursor-pointer transform transition-all duration-700 hover:scale-105 w-full ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onClick={() => handleCardClick(index)}
                >
                  {/* Card Container com flip */}
                  <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}>
                    
                    {/* Front Face */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br ${card.color} rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col items-center justify-center text-white shadow-2xl border border-white/10`}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-center">{card.title}</h3>
                      <p className="text-white/90 text-center text-xs sm:text-sm lg:text-base">{card.front}</p>
                      <div className="mt-2 sm:mt-3 text-xs lg:text-sm text-white/70">Toque para ver mais</div>
                    </div>

                    {/* Back Face */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-5 lg:p-6 flex flex-col items-center justify-center text-white shadow-2xl border border-indexa-mint/30`}>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-indexa-mint/20 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indexa-mint" />
                      </div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-2 text-indexa-mint text-center">{card.title}</h3>
                      <p className="text-white/90 text-center text-xs sm:text-sm lg:text-base leading-relaxed">{card.back}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Destaque Final - RESPONSIVO */}
          <div className="relative inline-block w-full max-w-2xl lg:max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-xl sm:rounded-2xl">
              <div className="bg-gray-900 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 rounded-xl sm:rounded-2xl">
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                  Conteúdo útil + Sua marca =
                </p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
                  Impacto Garantido
                </p>
              </div>
            </div>
            
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 rounded-xl sm:rounded-2xl blur-xl opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPanelsSection;
