
import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Instagram, Eye, Shield } from 'lucide-react';

const ObjectionsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeObjection, setActiveObjection] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const objections = [
    {
      icon: AlertTriangle,
      objection: "Nunca ouvi falar disso",
      answer: "Pioneirismo garante visibilidade exclusiva",
      explanation: "Ser o primeiro no mercado significa que sua marca não compete por atenção. Enquanto outros descobrem, você já domina o espaço.",
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Instagram,
      objection: "Já invisto no Instagram",
      answer: "Aqui sua marca está presente no mundo real",
      explanation: "Instagram compete com milhões de posts por segundo. Nos elevadores, você tem atenção exclusiva de um público cativo por 30-60 segundos.",
      color: 'from-pink-500 to-purple-500'
    },
    {
      icon: Eye,
      objection: "Ninguém vai ver",
      answer: "São 245 vezes por dia em olhos atentos",
      explanation: "Elevadores capturam 100% da atenção. Não há scroll, não há skip. Seu público assiste do início ao fim, várias vezes ao dia.",
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      objection: "Muito novo pra confiar",
      answer: "Projeto Indexa já presente em 50 prédios",
      explanation: "Não somos um experimento. Já operamos com sucesso em dezenas de locais, com resultados comprovados e clientes satisfeitos.",
      color: 'from-green-500 to-emerald-500'
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

  // Auto-cycle através das objeções
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveObjection((prev) => (prev + 1) % objections.length);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, objections.length]);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Respostas às Objeções
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Esclarecemos as principais dúvidas sobre publicidade em elevadores
          </p>

          {/* Grid de Objeções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {objections.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = activeObjection === index;
              
              return (
                <div
                  key={index}
                  className={`group relative transform transition-all duration-700 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${isActive ? 'scale-105' : 'hover:scale-102'}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                  onClick={() => setActiveObjection(index)}
                >
                  {/* Card Principal */}
                  <div className={`relative bg-gradient-to-br ${item.color} p-8 rounded-2xl shadow-2xl overflow-hidden ${
                    isActive ? 'ring-2 ring-indexa-mint ring-opacity-50' : ''
                  }`}>
                    {/* Efeito de iluminação */}
                    <div className={`absolute inset-0 bg-white/10 transition-opacity duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`} />
                    
                    {/* Ícone */}
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive ? 'scale-110' : 'scale-100'
                      }`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Objeção */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-2">
                        ""{item.objection}""
                      </h3>
                      <div className="w-12 h-1 bg-white/30 rounded-full" />
                    </div>

                    {/* Resposta */}
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white mb-3">
                        ✓ {item.answer}
                      </h4>
                    </div>

                    {/* Explicação expandida */}
                    <div className={`overflow-hidden transition-all duration-500 ${
                      isActive ? 'max-h-32 opacity-100' : 'max-h-16 opacity-70'
                    }`}>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>

                    {/* Indicador de atividade */}
                    <div className={`absolute bottom-4 right-4 w-3 h-3 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-indexa-mint animate-pulse' : 'bg-white/30'
                    }`} />

                    {/* Efeito de brilho */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-1000 ${
                      isActive ? 'translate-x-full' : '-translate-x-full'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicadores de progresso */}
          <div className="flex justify-center mt-12 space-x-3">
            {objections.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveObjection(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === activeObjection 
                    ? 'bg-indexa-mint scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* CTA Motivacional */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30">
              <p className="text-2xl font-bold text-white mb-2">
                <span className="text-indexa-mint">Resultado:</span> Sua marca onde a concorrência não está
              </p>
              <p className="text-white/80 text-lg">
                Enquanto outros hesitam, você já está conquistando seu espaço
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectionsSection;
