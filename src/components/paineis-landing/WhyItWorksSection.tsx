
import React, { useState, useEffect, useRef } from 'react';
import { Eye, Users, BarChart3, MousePointer, Building } from 'lucide-react';

const WhyItWorksSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedNumbers, setAnimatedNumbers] = useState({
    repetitions: 0,
    residents: 0,
    impressions: 0,
    accesses: 0,
    buildings: 0
  });
  const sectionRef = useRef<HTMLElement>(null);

  const stats = [
    {
      icon: Eye,
      number: 245,
      suffix: '',
      label: 'repetições por dia por elevador',
      description: 'Cada anúncio é visto múltiplas vezes pelo mesmo público',
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: Users,
      number: 22,
      suffix: 'mil',
      label: 'moradores atingidos só na primeira fase',
      description: 'Alcance direto sem depender de algoritmos',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: BarChart3,
      number: 880,
      suffix: 'mil',
      label: 'impressões semanais',
      description: 'Volume de visualizações garantido semanalmente',
      color: 'from-purple-500 to-purple-700'
    },
    {
      icon: MousePointer,
      number: 40,
      suffix: '',
      label: 'acessos semanais por morador (média)',
      description: 'Frequência alta de exposição à sua marca',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Building,
      number: 50,
      suffix: '',
      label: 'prédios na fase 1',
      description: 'Cobertura estratégica em pontos premium da cidade',
      color: 'from-indexa-purple to-indexa-mint'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          animateNumbers();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const animateNumbers = () => {
    const duration = 2000; // 2 segundos
    const steps = 60; // 60 frames
    const stepDuration = duration / steps;

    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedNumbers({
        repetitions: Math.floor(245 * progress),
        residents: Math.floor(22 * progress),
        impressions: Math.floor(880 * progress),
        accesses: Math.floor(40 * progress),
        buildings: Math.floor(50 * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedNumbers({
          repetitions: 245,
          residents: 22,
          impressions: 880,
          accesses: 40,
          buildings: 50
        });
      }
    }, stepDuration);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Por que funciona tanto?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed">
            Números reais que comprovam a efetividade dos painéis digitais em elevadores
          </p>

          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              
              return (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br ${stat.color} p-8 rounded-2xl transform transition-all duration-700 hover:scale-105 hover:shadow-2xl ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                >
                  {/* Efeito de brilho de fundo */}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Ícone */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Número Animado */}
                  <div className="relative mb-4">
                    <span className="text-4xl md:text-5xl font-bold text-white block">
                      {index === 0 ? animatedNumbers.repetitions :
                       index === 1 ? animatedNumbers.residents :
                       index === 2 ? animatedNumbers.impressions :
                       index === 3 ? animatedNumbers.accesses :
                       animatedNumbers.buildings}
                      <span className="text-2xl ml-1">{stat.suffix}</span>
                    </span>
                  </div>

                  {/* Label */}
                  <h3 className="text-lg font-bold text-white mb-3 leading-tight">
                    {stat.label}
                  </h3>
                  
                  {/* Descrição */}
                  <p className="text-white/90 text-sm leading-relaxed">
                    {stat.description}
                  </p>

                  {/* Indicador visual */}
                  <div className="mt-6 w-12 h-1 bg-white/30 rounded-full mx-auto group-hover:w-20 group-hover:bg-white/60 transition-all duration-500" />
                </div>
              );
            })}
          </div>

          {/* Destaque Final */}
          <div className="relative">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30">
              <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                <span className="text-indexa-mint">Resultado:</span> Sua marca presente no dia a dia
              </p>
              <p className="text-white/80 text-lg">
                Não é apenas publicidade, é presença constante na rotina do seu público
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyItWorksSection;
