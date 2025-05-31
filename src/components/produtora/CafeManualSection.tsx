
import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Gift, MapPin, Clock } from 'lucide-react';

const CafeManualSection = () => {
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

  const benefits = [
    {
      icon: Coffee,
      title: 'Tour Exclusivo',
      description: 'Veja de perto onde ideias viram vídeos que vendem'
    },
    {
      icon: Gift,
      title: 'Manual Gratuito',
      description: 'Dicas práticas de IA e apps para empresas de Foz'
    },
    {
      icon: Clock,
      title: 'Apenas 15 Cafés/Mês',
      description: 'Experiência exclusiva e personalizada'
    }
  ];

  return (
    <section 
      id="cafe-section"
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-indexa-purple-dark via-indexa-purple to-indexa-purple-dark"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone central */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indexa-mint/20 rounded-full mb-6">
              <Coffee className="w-10 h-10 text-indexa-mint" />
            </div>
          </div>

          {/* Título e texto emocional */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Vamos tomar um café no 
              <span className="block text-indexa-mint">nosso estúdio?</span>
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <p className="text-xl text-white/90 leading-relaxed">
                Você verá de perto onde <span className="text-indexa-mint font-semibold">ideias viram vídeos que vendem</span>. 
                Além disso, preparamos um presente especial:
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-lg text-white leading-relaxed">
                  <span className="text-indexa-mint font-bold">Um manual prático</span> com dicas de IA e apps 
                  para empresas de Foz do Iguaçu. 
                  <span className="block mt-2 font-semibold">Gratuito. Exclusivo. Para quem agenda.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Benefícios em cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all duration-500 hover:scale-105 transform ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="w-12 h-12 bg-indexa-mint/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-indexa-mint" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>

          {/* Gatilho de escassez */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-red-500/20 border border-red-400/30 rounded-full px-6 py-3">
              <Clock className="w-5 h-5 text-red-300 mr-2" />
              <span className="text-red-300 font-semibold">Apenas 15 cafés por mês agendados</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={scrollToBriefing}
              className="group bg-indexa-mint text-indexa-purple-dark font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 group-hover:bounce transition-transform duration-300" />
                <span>Agendar Meu Café Exclusivo</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CafeManualSection;
