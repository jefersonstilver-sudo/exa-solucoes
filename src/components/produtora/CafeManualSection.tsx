
import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Gift, MapPin } from 'lucide-react';

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
      title: 'Manual Impresso',
      description: 'Dicas práticas de IA e apps para empresários de Foz'
    },
    {
      icon: MapPin,
      title: 'Experiência Única',
      description: 'Converse com nossa equipe e descubra novas possibilidades'
    }
  ];

  return (
    <section 
      id="cafe-section"
      ref={sectionRef}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone central */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#00B377]/20 rounded-full mb-6">
              <Coffee className="w-10 h-10 text-[#00B377]" />
            </div>
          </div>

          {/* Título e texto emocional */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Agende um café no 
              <span className="block text-[#00B377]">nosso estúdio!</span>
            </h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <p className="text-xl text-gray-700 leading-relaxed">
                Converse com a nossa equipe e <span className="text-[#00B377] font-semibold">ganhe um manual impresso</span> para dicas de como usar IA e apps no seu negócio para empresários de Foz do Iguaçu.
              </p>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <p className="text-lg text-gray-800 leading-relaxed">
                  <span className="text-[#00B377] font-bold">Experiência completa:</span> você verá de perto onde ideias viram vídeos que vendem, além de receber estratégias exclusivas para o seu negócio.
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
                  className={`bg-white border border-gray-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 transform ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  <div className="w-12 h-12 bg-[#00B377]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-[#00B377]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={scrollToBriefing}
              className="group bg-[#00B377] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-[#00B377]/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center space-x-2">
                <Gift className="w-5 h-5 group-hover:bounce transition-transform duration-300" />
                <span>Agendar Minha Reunião + Brinde</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CafeManualSection;
