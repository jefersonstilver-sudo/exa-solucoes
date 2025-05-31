
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, BarChart3, Shield, Target, Brain } from 'lucide-react';

const BenefitsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const benefits = [
    {
      icon: MapPin,
      title: 'Localização Premium',
      description: 'Prédios estratégicos nas melhores regiões da cidade'
    },
    {
      icon: BarChart3,
      title: 'Controle Total',
      description: 'Gerencie exibições e horários em tempo real'
    },
    {
      icon: Shield,
      title: 'Sistema Seguro',
      description: 'Protocolo de emergência e backup automático'
    },
    {
      icon: Target,
      title: 'Segmentação Precisa',
      description: 'Escolha exatamente onde sua marca aparece'
    },
    {
      icon: Brain,
      title: 'Inteligência Digital',
      description: 'Atualização remota e programação inteligente'
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
      className="min-h-screen bg-gradient-to-br from-indexa-purple/5 to-indexa-mint/5 flex items-center justify-center py-20 px-4 snap-start"
      id="benefits-section"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-indexa-purple mb-16">
            Por que escolher a
            <span className="block bg-gradient-to-r from-indexa-purple to-indexa-mint bg-clip-text text-transparent">
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
                  className={`group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Ícone */}
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Conteúdo */}
                  <h3 className="text-xl font-bold text-indexa-purple mb-3 group-hover:text-indexa-mint transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>

                  {/* Indicador visual */}
                  <div className="mt-6 w-12 h-1 bg-gradient-to-r from-indexa-purple to-indexa-mint rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
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
