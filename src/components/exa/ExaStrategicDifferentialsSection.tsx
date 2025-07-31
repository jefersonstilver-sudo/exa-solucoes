import React, { useEffect, useState, useRef } from 'react';
import { Target, Calendar, BarChart3, Zap } from 'lucide-react';

const ExaStrategicDifferentialsSection: React.FC = () => {
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

  const differentials = [
    {
      icon: Target,
      title: "Segmentação inteligente",
      description: "Direcione vídeos por prédio, por bairro, por dia da semana ou por hora do dia. Uma padaria pode exibir um vídeo de café da manhã das 6h às 10h, e uma pizzaria um combo promocional das 18h às 22h — com controle total, prédio a prédio.",
      gradient: "from-purple-500 to-purple-700"
    },
    {
      icon: Calendar,
      title: "Programação múltipla com até 4 vídeos por campanha",
      description: "A cada campanha, é possível programar até quatro variações de vídeo por local, período e objetivo. Um conteúdo institucional pode ir ao ar em certos horários, enquanto outro mais comercial atua em momentos de maior decisão.",
      gradient: "from-indigo-500 to-indigo-700"
    },
    {
      icon: BarChart3,
      title: "Relatórios reais e acionáveis",
      description: "A EXA oferece transparência total: número de exibições por prédio, visualizações estimadas, horários, interação por QR Code e cliques em links integrados.",
      gradient: "from-purple-600 to-indigo-600"
    },
    {
      icon: Zap,
      title: "ROI Comprovado e Mensurável",
      description: "Retorno sobre investimento demonstrado com métricas reais e resultados tangíveis para seu negócio. Acompanhe o crescimento das suas vendas em tempo real.",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16"
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text leading-tight tracking-wide">
            Diferenciais Estratégicos Poderosos
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {differentials.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${item.gradient} rounded-xl p-6 sm:p-8 lg:p-10 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-102 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4 sm:space-x-6">
                  <div className="flex-shrink-0">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white/90 transition-transform duration-300 group-hover:rotate-360" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-exo-2 font-bold mb-3 sm:mb-4 leading-tight tracking-wide">
                      {item.title}
                    </h3>
                    <p className="font-exo-2 font-light text-white/90 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed tracking-wide">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExaStrategicDifferentialsSection;