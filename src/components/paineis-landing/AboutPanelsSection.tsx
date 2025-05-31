
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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-16 sm:py-20 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-gray-900 bg-clip-text text-transparent">
              O que são os Painéis da Indexa?
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed">
            Uma tecnologia de gestão condominial que transforma elevadores em canais de mídia digital altamente visíveis.
          </p>

          <p className="text-base sm:text-lg text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed">
            Nossos painéis inteligentes informam os moradores com conteúdo útil e relevante, 
            intercalando essas informações com sua publicidade de forma estratégica e não invasiva.
          </p>

          {/* Grid de Cards Interativos com Flip - RESPONSIVO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            {cards.map((card, index) => {
              const IconComponent = card.icon;
              const isFlipped = flippedCard === index;
              
              return (
                <div
                  key={index}
                  className={`relative h-56 sm:h-64 cursor-pointer transform transition-all duration-700 hover:scale-105 ${
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
                    <div className={`absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br ${card.color} rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-white shadow-2xl border border-white/10`}>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-white/90 text-center text-sm">{card.front}</p>
                      <div className="mt-3 sm:mt-4 text-xs text-white/70">Toque para ver mais</div>
                    </div>

                    {/* Back Face */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-gray-900 shadow-2xl border border-indexa-mint/30`}>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indexa-mint/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-indexa-mint" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-indexa-mint">{card.title}</h3>
                      <p className="text-gray-700 text-center text-xs sm:text-sm leading-relaxed">{card.back}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Destaque Final - RESPONSIVO */}
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl border border-gray-200">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Conteúdo útil + Sua marca =
                </p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">
                  Impacto Garantido
                </p>
              </div>
            </div>
            
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/10 to-indexa-purple/10 rounded-2xl blur-xl opacity-30" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPanelsSection;
