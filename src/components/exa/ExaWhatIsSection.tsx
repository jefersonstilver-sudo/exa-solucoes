import React, { useEffect, useState, useRef } from 'react';

const ExaWhatIsSection: React.FC = () => {
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

  return (
    <section 
      ref={sectionRef}
      className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-400 bg-clip-text mb-8 sm:mb-10 lg:mb-12 leading-tight tracking-wide">
            Não é só publicidade. É uma plataforma viva dentro dos prédios.
          </h2>
          
          <div className="space-y-6 sm:space-y-8 text-white/90 font-exo-2 font-light text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed tracking-wide">
            <p>
              A EXA é uma rede de painéis digitais conectados à internet em tempo real, instalada em elevadores, halls e áreas de convivência de prédios premium.
              Ela transforma esses espaços em pontos estratégicos de comunicação inteligente e impacto visual diário.
            </p>
            
            <p>
              Cada painel exibe múltiplas atrações simultâneas — câmeras ao vivo, cotações, notícias, alertas condominiais — tudo isso acontecendo enquanto o vídeo da sua marca entra em cena com destaque, presença e elegância.
            </p>
            
            <p className="font-semibold text-purple-200">
              E o melhor: isso acontece mais de 40 vezes por semana para cada morador, já que o uso do elevador varia entre 5 a 7 vezes por dia por pessoa.
            </p>
            
            <p>
              A EXA não é uma tela. É um ambiente de atenção recorrente, onde sua marca se integra à rotina das pessoas — com frequência, contexto e inteligência.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaWhatIsSection;