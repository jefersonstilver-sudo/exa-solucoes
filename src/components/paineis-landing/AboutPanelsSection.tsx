
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
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: DollarSign,
      title: 'Cotações do Dólar',
      front: 'Valores atualizados da moeda',
      back: 'Cotação do dólar, peso argentino e guarani paraguaio em tempo real',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: Bell,
      title: 'Avisos do Síndico',
      front: 'Comunicados importantes',
      back: 'Informações sobre assembleias, manutenções e avisos gerais do condomínio',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Newspaper,
      title: 'Notícias da Cidade',
      front: 'Informações locais relevantes',
      back: 'Principais acontecimentos de Foz do Iguaçu e região da tríplice fronteira',
      color: 'from-purple-500 to-purple-700'
    },
    {
      icon: Car,
      title: 'Trânsito Ponte da Amizade',
      front: 'Situação da fronteira',
      back: 'Tempo de espera, fluxo de veículos e condições de travessia atualizados',
      color: 'from-red-500 to-red-700'
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
      { threshold: 0.3 }
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
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              O que são os Painéis da Indexa?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed">
            Transformamos elevadores em canais de mídia digital altamente visíveis. 
            Nossos painéis exibem conteúdo dinâmico intercalado com sua publicidade.
          </p>

          {/* Grid de Cards Interativos com Flip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {cards.map((card, index) => {
              const IconComponent = card.icon;
              const isFlipped = flippedCard === index;
              
              return (
                <div
                  key={index}
                  className={`relative h-64 cursor-pointer transform transition-all duration-700 hover:scale-105 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                  onClick={() => handleCardClick(index)}
                >
                  {/* Card Container com flip */}
                  <div className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}>
                    
                    {/* Front Face */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br ${card.color} rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-2xl border border-white/10`}>
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                      <p className="text-white/90 text-center text-sm">{card.front}</p>
                      <div className="mt-4 text-xs text-white/70">Toque para ver mais</div>
                    </div>

                    {/* Back Face */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 flex flex-col items-center justify-center text-white shadow-2xl border border-indexa-mint/30`}>
                      <div className="w-12 h-12 bg-indexa-mint/20 rounded-full flex items-center justify-center mb-4">
                        <IconComponent className="w-6 h-6 text-indexa-mint" />
                      </div>
                      <h3 className="text-lg font-bold mb-3 text-indexa-mint">{card.title}</h3>
                      <p className="text-white/90 text-center text-sm leading-relaxed">{card.back}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Destaque Final */}
          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-gray-900 px-8 py-6 rounded-2xl">
                <p className="text-xl md:text-2xl font-bold text-white mb-2">
                  Conteúdo útil + Sua marca =
                </p>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
                  Impacto Garantido
                </p>
              </div>
            </div>
            
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 rounded-2xl blur-xl opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPanelsSection;
