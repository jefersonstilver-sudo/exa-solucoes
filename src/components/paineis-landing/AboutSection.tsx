
import React, { useState, useEffect, useRef } from 'react';
import { Building2, TrendingUp, MapPin, Wifi } from 'lucide-react';

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

  const features = [
    {
      icon: TrendingUp,
      title: 'Cotações em Tempo Real',
      description: 'Parceria com Ápice Câmbios'
    },
    {
      icon: MapPin,
      title: 'Clima e Trânsito',
      description: 'Ponte da Amizade atualizado'
    },
    {
      icon: Building2,
      title: 'Conteúdo Institucional',
      description: 'Cultural e informativo'
    },
    {
      icon: Wifi,
      title: 'Atualização Remota',
      description: 'Em tempo real'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gray-800 flex items-center justify-center py-20 px-4 snap-start"
      id="about-section"
    >
      <div className="max-w-6xl mx-auto text-center">
        <div className={`transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-12 leading-tight">
            <span className="bg-gradient-to-r from-white to-indexa-mint bg-clip-text text-transparent drop-shadow-lg">
              O que são os
            </span>
            <span className="block text-white drop-shadow-lg">
              Painéis Indexa?
            </span>
          </h2>

          <div className="space-y-8 mb-16">
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed font-light max-w-4xl mx-auto">
              Transformamos elevadores em canais de mídia digital altamente visíveis.
            </p>
            
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
              Nossos painéis exibem conteúdo dinâmico e sua marca com exibição automática, 
              remota e atualizada em tempo real.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={index}
                  className={`group bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-indexa-mint/50 transition-all duration-500 hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indexa-mint transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="relative inline-block">
            <div className="bg-gradient-to-r from-indexa-purple to-indexa-mint p-1 rounded-2xl">
              <div className="bg-gray-800 px-8 py-6 rounded-2xl">
                <p className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Fase 1 do projeto já cobre mais de
                </p>
                <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
                  22.000 moradores
                </p>
                <p className="text-white/80 mt-2">diretamente</p>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 rounded-2xl blur-xl opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
