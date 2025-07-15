import React, { useState, useRef, useEffect } from 'react';
import { Camera, Monitor, Mic, Settings, Zap, Star, ArrowRight, CheckCircle } from 'lucide-react';

const InfrastructureSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeEquipment, setActiveEquipment] = useState(0);
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

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveEquipment((prev) => (prev + 1) % equipment.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const equipment = [
    {
      icon: Camera,
      title: "Equipamentos de Filmagem",
      subtitle: "Tecnologia 4K+ Profissional",
      specs: [
        "Câmeras RED Cinema 6K",
        "Sony FX9 Full Frame",
        "Lentes Cinema Zeiss",
        "Estabilizadores Gimbal",
        "Drones DJI Inspire Pro"
      ],
      highlight: "Qualidade cinematográfica garantida"
    },
    {
      icon: Mic,
      title: "Sistema de Áudio",
      subtitle: "Captação Premium",
      specs: [
        "Microfones Lavalier Sennheiser",
        "Boom poles profissionais",
        "Gravadores Zoom H6",
        "Tratamento acústico",
        "Pós-produção 5.1"
      ],
      highlight: "Áudio cristalino em qualquer ambiente"
    },
    {
      icon: Monitor,
      title: "Iluminação Profissional",
      subtitle: "LED Cinema Grade",
      specs: [
        "Painel LED Aputure 600d",
        "Softboxes modulares",
        "Controle de temperatura cor",
        "Sistema wireless DMX",
        "Filtros e difusores"
      ],
      highlight: "Iluminação perfeita para qualquer ocasião"
    },
    {
      icon: Settings,
      title: "Estúdio Completo",
      subtitle: "Ambiente Controlado",
      specs: [
        "Ciclorama infinito",
        "Pé direito 4 metros",
        "Climatização silenciosa",
        "Teleprompter profissional",
        "Cenários modulares"
      ],
      highlight: "A partir de R$ 200/hora - Preço exclusivo"
    }
  ];

  const scrollToServices = () => {
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-indexa-mint/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indexa-purple/10 to-transparent rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-indexa-purple/10 text-indexa-purple px-6 py-3 rounded-full text-sm font-bold mb-6">
            <Zap className="w-5 h-5" />
            Infraestrutura de Ponta
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tecnologia Que Faz a
            <span className="block text-indexa-purple">Diferença</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Investimos continuamente em equipamentos de última geração para garantir que cada projeto tenha a qualidade técnica que sua marca merece.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Equipment Showcase */}
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className="bg-white rounded-2xl p-8 shadow-enhanced border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-gradient-to-r from-indexa-purple to-indexa-purple-dark rounded-xl">
                  {React.createElement(equipment[activeEquipment].icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {equipment[activeEquipment].title}
                  </h3>
                  <p className="text-indexa-purple font-medium">
                    {equipment[activeEquipment].subtitle}
                  </p>
                </div>
              </div>

              <div className="bg-indexa-mint/10 rounded-xl p-4 mb-6">
                <p className="text-indexa-purple font-bold text-center">
                  {equipment[activeEquipment].highlight}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Especificações:</h4>
                {equipment[activeEquipment].specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indexa-mint" />
                    <span className="text-gray-700">{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Equipment Grid */}
          <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="grid grid-cols-2 gap-4">
              {equipment.map((item, index) => (
                <div
                  key={index}
                  className={`group cursor-pointer p-6 rounded-xl border-2 transition-all duration-300 ${
                    activeEquipment === index
                      ? 'border-indexa-purple bg-gradient-to-br from-indexa-purple/5 to-indexa-mint/5 shadow-enhanced'
                      : 'border-gray-200 bg-white hover:border-indexa-purple/30 hover:shadow-lg'
                  }`}
                  onClick={() => setActiveEquipment(index)}
                >
                  <item.icon className={`w-8 h-8 mb-3 transition-colors ${
                    activeEquipment === index ? 'text-indexa-purple' : 'text-gray-400 group-hover:text-indexa-purple'
                  }`} />
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-600">{item.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Studio Highlight */}
            <div className="mt-6 bg-gradient-to-r from-indexa-mint to-indexa-mint-light rounded-xl p-6 text-indexa-purple">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-6 h-6" />
                <h4 className="font-bold text-lg">Estúdio Premium Disponível</h4>
              </div>
              <p className="text-sm mb-4">
                Nosso estúdio profissional está disponível para locação com preços acessíveis, mantendo a qualidade premium.
              </p>
              <div className="flex items-center justify-between">
                <div className="font-bold text-xl">A partir de R$ 200/hora</div>
                <button className="bg-indexa-purple text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indexa-purple-dark transition-colors flex items-center gap-2">
                  Reservar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Differentials */}
        <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="bg-white rounded-2xl p-8 shadow-enhanced border border-gray-100">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              O Que Nos Diferencia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indexa-purple/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-indexa-purple" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Equipamentos Premium</h4>
                <p className="text-gray-600 text-sm">
                  Investimento constante em tecnologia de ponta para qualidade cinematográfica
                </p>
              </div>
              <div className="text-center">
                <div className="bg-indexa-mint/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-indexa-purple" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Versatilidade Total</h4>
                <p className="text-gray-600 text-sm">
                  Desde gravações em estúdio até produções externas com drones
                </p>
              </div>
              <div className="text-center">
                <div className="bg-indexa-purple/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-indexa-purple" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Preços Acessíveis</h4>
                <p className="text-gray-600 text-sm">
                  Qualidade premium com preços que cabem no seu orçamento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center mt-12 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button 
            onClick={scrollToServices}
            className="bg-gradient-to-r from-indexa-purple to-indexa-purple-dark text-white px-8 py-4 rounded-xl font-bold hover:shadow-enhanced-hover transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
          >
            Conhecer Nossos Serviços
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default InfrastructureSection;