import React, { useState, useEffect, useRef } from 'react';

const DiferenciaisSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  const cards = [
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14L17 4M10 8v8M14 8v8" />
        </svg>
      ),
      title: "Vídeos Cinematográficos que Cativam",
      description: "Nossas produções usam técnicas de alto nível para criar vídeos que parecem filmes, resolvendo a dor de conteúdos planos ao construir profundidade emocional e atração visual que atrai seu público.",
      color: "text-orange-400"
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Estúdio Avançado como Nosso Diferencial Assinatura",
      description: "Nosso estúdio de ponta em Foz é o diferencial que eleva cada gravação – equipado com chroma key infinito, iluminação LED profissional e conjuntos personalizáveis, é o espaço perfeito para trazer sua visão à vida com sofisticação inigualável.",
      color: "text-green-400"
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      title: "Abordagem Integrada para Impacto Duradouro",
      description: "Tecemos estratégias sutis em cada quadro, criando narrativas que conectam profundamente e transformam desafios de negócios em oportunidades de crescimento.",
      color: "text-blue-400"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-800 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="font-playfair text-3xl lg:text-4xl xl:text-5xl text-white mb-6 leading-tight">
            O Que Nos Torna Únicos no Mundo Cinematográfico
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {cards.map((card, index) => (
            <div
              key={index}
              className={`transition-all duration-800 ease-out ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 rounded-2xl p-8 h-full transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/20">
                {/* Icon */}
                <div className={`${card.color} mb-6 transform transition-transform duration-300 hover:rotate-12`}>
                  {card.icon}
                </div>

                {/* Title */}
                <h3 className="font-montserrat font-bold text-xl lg:text-2xl text-white mb-4 leading-tight">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="font-montserrat text-base lg:text-lg text-gray-200 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiferenciaisSection;