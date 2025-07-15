import React, { useState, useRef, useEffect } from 'react';
import { Video, Users, Camera, Monitor, Zap, Award, ArrowRight, CheckCircle } from 'lucide-react';

const PremiumServicesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeService, setActiveService] = useState(0);
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

  const services = [
    {
      icon: Video,
      title: "Vídeos Institucionais & Corporativos",
      description: "Conte a história da sua empresa com impacto visual e narrativa estratégica que engaja e converte.",
      features: ["Roteiro estratégico", "Produção cinematográfica", "Edição profissional", "Entrega em múltiplos formatos"],
      pricing: "A partir de R$ 3.500",
      highlight: true
    },
    {
      icon: Users,
      title: "Cobertura de Eventos Exclusivos",
      description: "Registre momentos únicos com qualidade premium, desde convenções corporativas até lançamentos de produtos.",
      features: ["Múltiplas câmeras", "Áudio profissional", "Edição em tempo real", "Transmissão ao vivo"],
      pricing: "A partir de R$ 2.800"
    },
    {
      icon: Camera,
      title: "Produção com Drones Cinematográficos",
      description: "Perspectivas aéreas impressionantes que elevam a qualidade visual dos seus conteúdos.",
      features: ["Drones 4K profissionais", "Pilotos certificados", "Planos de voo personalizados", "Edição especializada"],
      pricing: "A partir de R$ 1.200"
    },
    {
      icon: Monitor,
      title: "Apresentações com Teleprompter",
      description: "Garanta naturalidade e fluidez nas apresentações dos seus executivos e porta-vozes.",
      features: ["Teleprompter profissional", "Coaching de apresentação", "Múltiplas câmeras", "Iluminação dedicada"],
      pricing: "A partir de R$ 900"
    },
    {
      icon: Award,
      title: "Estúdio Profissional Disponível",
      description: "Espaço equipado com tecnologia de ponta para gravações em ambiente controlado.",
      features: ["Estúdio climatizado", "Iluminação LED", "Áudio tratado", "Cenários personalizáveis"],
      pricing: "A partir de R$ 200/hora",
      special: true
    }
  ];

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      id="services-section"
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-white to-gray-50"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-purple/10 text-indexa-purple px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Nossos Serviços Premium
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Soluções Completas em
            <span className="block text-indexa-purple">Produção Audiovisual</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cada projeto é único. Oferecemos soluções personalizadas que combinam criatividade, tecnologia de ponta e estratégia para alcançar seus objetivos de comunicação.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <div
              key={index}
              className={`group relative bg-white rounded-2xl p-8 border-2 transition-all duration-500 hover:shadow-enhanced cursor-pointer ${
                service.highlight ? 'border-indexa-purple bg-gradient-to-br from-indexa-purple/5 to-indexa-mint/5' : 
                service.special ? 'border-indexa-mint bg-gradient-to-br from-indexa-mint/5 to-indexa-purple/5' :
                'border-gray-200 hover:border-indexa-purple/30'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setActiveService(index)}
            >
              {service.highlight && (
                <div className="absolute -top-3 left-8 bg-indexa-purple text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Procurado
                </div>
              )}
              
              {service.special && (
                <div className="absolute -top-3 left-8 bg-indexa-mint text-indexa-purple px-4 py-1 rounded-full text-sm font-bold">
                  Preço Atrativo
                </div>
              )}

              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${
                  service.highlight ? 'bg-indexa-purple text-white' :
                  service.special ? 'bg-indexa-mint text-indexa-purple' :
                  'bg-indexa-purple/10 text-indexa-purple group-hover:bg-indexa-purple group-hover:text-white'
                } transition-all duration-300`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {service.features.map((feature, featIndex) => (
                  <div key={featIndex} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indexa-mint" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className={`font-bold text-lg ${
                  service.special ? 'text-indexa-mint' : 'text-indexa-purple'
                }`}>
                  {service.pricing}
                </div>
                <button className="text-indexa-purple hover:text-indexa-mint transition-colors flex items-center gap-1 text-sm font-medium">
                  Saiba mais
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-gradient-to-r from-indexa-purple to-indexa-purple-dark rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Vamos Criar Algo Incrível Juntos?</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Cada projeto é uma oportunidade de superar expectativas. Entre em contato e descubra como podemos transformar sua visão em realidade.
            </p>
            <button 
              onClick={scrollToContact}
              className="bg-indexa-mint text-indexa-purple px-8 py-4 rounded-xl font-bold hover:bg-indexa-mint-light transform hover:scale-105 transition-all duration-300"
            >
              Solicitar Orçamento Personalizado
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumServicesSection;