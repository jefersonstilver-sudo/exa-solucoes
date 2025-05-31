
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Target, Wifi, Film, Headphones } from 'lucide-react';

const ExclusiveBenefitsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredBenefit, setHoveredBenefit] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const benefits = [
    {
      icon: MapPin,
      title: 'Localização Premium',
      description: 'Prédios em regiões valorizadas de Foz do Iguaçu com expansão para o Paraguai',
      details: 'Selecionamos estrategicamente os melhores endereços da cidade para maximizar o impacto da sua marca',
      color: 'from-blue-500 to-blue-700'
    },
    {
      icon: Target,
      title: 'Segmentação por Bairro',
      description: 'Escolha exatamente onde sua marca aparece com precisão geográfica',
      details: 'Foque no seu público-alvo selecionando bairros específicos e perfis demográficos ideais',
      color: 'from-green-500 to-green-700'
    },
    {
      icon: Wifi,
      title: 'Atualização Remota',
      description: 'Controle total à distância com atualizações em tempo real',
      details: 'Modifique campanhas, horários e conteúdo instantaneamente através da nossa plataforma',
      color: 'from-purple-500 to-purple-700'
    },
    {
      icon: Film,
      title: 'Design Cinematográfico',
      description: 'Qualidade visual premium que destaca sua marca',
      details: 'Vídeos em alta resolução com transições suaves e efeitos visuais profissionais',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Headphones,
      title: 'Suporte Humano',
      description: 'Atendimento personalizado durante toda a campanha',
      details: 'Equipe especializada disponível para otimizar resultados e esclarecer dúvidas',
      color: 'from-orange-500 to-yellow-500'
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

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-gray-900 bg-clip-text text-transparent">
              Benefícios Exclusivos
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-gray-700 mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Vantagens que só a Indexa oferece para maximizar o impacto da sua marca
          </p>

          {/* Grid de Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              const isHovered = hoveredBenefit === index;
              
              return (
                <div
                  key={index}
                  className={`group relative transform transition-all duration-700 hover:scale-105 hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                  onMouseEnter={() => setHoveredBenefit(index)}
                  onMouseLeave={() => setHoveredBenefit(null)}
                >
                  {/* Card com gradiente */}
                  <div className={`relative bg-gradient-to-br ${benefit.color} p-8 rounded-2xl h-full shadow-2xl overflow-hidden`}>
                    {/* Efeito de iluminação no hover */}
                    <div className={`absolute inset-0 bg-white/10 transition-opacity duration-500 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`} />
                    
                    {/* Ícone com animação */}
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto transition-all duration-500 ${
                        isHovered ? 'scale-110 rotate-6' : 'scale-100'
                      }`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-xl font-bold text-white mb-4 text-center">
                      {benefit.title}
                    </h3>

                    {/* Descrição */}
                    <p className="text-white/90 text-center text-sm leading-relaxed mb-4">
                      {benefit.description}
                    </p>

                    {/* Detalhes expandidos */}
                    <div className={`overflow-hidden transition-all duration-500 ${
                      isHovered ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-white/80 text-xs text-center leading-relaxed">
                          {benefit.details}
                        </p>
                      </div>
                    </div>

                    {/* Indicador de interação */}
                    <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full transition-all duration-500 ${
                      isHovered ? 'w-16 bg-white/60' : 'w-8'
                    }`} />

                    {/* Efeito de brilho deslizante */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-transform duration-1000 ${
                      isHovered ? 'translate-x-full' : '-translate-x-full'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Destaque de Segurança */}
          <div className="mt-16 text-center">
            <div className="relative inline-block">
              <div className="bg-gradient-to-r from-indexa-purple/10 to-indexa-mint/10 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  <span className="text-indexa-mint">Sistema de Segurança Avançado</span>
                </h3>
                <p className="text-gray-700 text-lg">
                  Monitoramento 24h, backup automático e garantia de funcionamento contínuo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExclusiveBenefitsSection;
