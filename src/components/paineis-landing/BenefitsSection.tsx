
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Settings, Shield, Target, Brain } from 'lucide-react';

const BenefitsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const benefits = [
    {
      icon: MapPin,
      title: 'Localização Premium',
      description: 'Prédios em regiões valorizadas de Foz do Iguaçu e expansão para o Paraguai'
    },
    {
      icon: Settings,
      title: 'Controle Total',
      description: 'Horários, quantidade e local de exibições na palma da sua mão'
    },
    {
      icon: Shield,
      title: 'Sistema Seguro',
      description: 'Protocolo 573040 com travamento remoto e backup automático'
    },
    {
      icon: Target,
      title: 'Segmentação Precisa',
      description: 'Escolha bairros, perfis e público com inteligência de dados'
    },
    {
      icon: Brain,
      title: 'Inteligência Digital',
      description: 'Programado remotamente com atualizações instantâneas'
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

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center py-20 px-4 snap-start"
      id="benefits-section"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
            Por que escolher a
            <span className="block bg-gradient-to-r from-indexa-mint to-indexa-purple bg-clip-text text-transparent">
              Indexa?
            </span>
          </h2>

          {/* Grid de benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              
              return (
                <div
                  key={index}
                  className={`group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-indexa-mint/50 transform transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-indexa-mint/20 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Efeito de iluminação de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indexa-mint/5 to-indexa-purple/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Ícone com animação */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Efeito de brilho no ícone */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/30 to-indexa-purple/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Conteúdo */}
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-indexa-mint transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-white/80 leading-relaxed group-hover:text-white transition-colors duration-300">
                    {benefit.description}
                  </p>

                  {/* Indicador visual de movimento */}
                  <div className="mt-6 w-12 h-1 bg-gradient-to-r from-indexa-purple to-indexa-mint rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                  
                  {/* Efeito de brilho no card inteiro */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
