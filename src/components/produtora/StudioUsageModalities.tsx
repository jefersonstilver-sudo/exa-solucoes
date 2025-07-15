import React, { useState, useEffect, useRef } from 'react';
import { Clock, Users, Zap, Calendar, Calculator, CheckCircle } from 'lucide-react';

const StudioUsageModalities = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [hours, setHours] = useState(4);
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

  const packages = [
    {
      icon: Clock,
      title: 'Locação Completa',
      subtitle: 'Estúdio + Equipamentos',
      price: 800,
      unit: '/hora',
      minHours: 4,
      description: 'Acesso total ao estúdio com todos os equipamentos',
      includes: [
        'Todas as câmeras (RED, Blackmagic)',
        'Chroma key 360° completo',
        'Teleprompter profissional',
        'Iluminação cinematográfica',
        'Sistema de áudio profissional',
        'Técnico de apoio incluído'
      ],
      popular: false,
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Produção Completa',
      subtitle: 'Estúdio + Equipe Especializada',
      price: 8000,
      unit: '/dia',
      minHours: 8,
      description: 'Produção full-service com equipe técnica completa',
      includes: [
        'Estúdio + todos os equipamentos',
        'Diretor de fotografia',
        'Operadores especializados',
        'Técnico de som profissional',
        'Roteirização T.A.C.C.O.H.',
        'Edição e finalização incluída'
      ],
      popular: true,
      color: 'yellow'
    },
    {
      icon: Zap,
      title: 'Transmissão Live',
      subtitle: 'Setup Profissional para Lives',
      price: 2000,
      unit: '/evento',
      minHours: 2,
      description: 'Configuração completa para transmissões ao vivo',
      includes: [
        'Múltiplas câmeras profissionais',
        'Switcher e streaming',
        'Chroma key em tempo real',
        'Suporte técnico completo',
        'Transmissão para plataformas',
        'Gravação backup incluída'
      ],
      popular: false,
      color: 'red'
    }
  ];

  const calculatePrice = (packageIndex: number, hours: number) => {
    const pkg = packages[packageIndex];
    if (packageIndex === 1) return pkg.price; // Produção completa é preço fixo por dia
    if (packageIndex === 2) return pkg.price; // Live é preço fixo por evento
    return pkg.price * hours; // Locação é por hora
  };

  const scrollToQuote = () => {
    const quoteSection = document.getElementById('quote-section');
    quoteSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-full px-6 py-2 mb-8">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-600 font-bold text-sm tracking-wide">MODALIDADES DE USO</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              COMO USAR NOSSO
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ESTÚDIO CINEMATOGRÁFICO
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Escolha a modalidade perfeita para seu projeto. Desde locação simples até produção completa
            </p>
          </div>

          {/* Grid de pacotes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {packages.map((pkg, index) => {
              const IconComponent = pkg.icon;
              const isSelected = index === selectedPackage;
              
              return (
                <div
                  key={index}
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    isSelected 
                      ? 'scale-105 shadow-2xl' 
                      : 'hover:scale-102 shadow-lg hover:shadow-xl'
                  } ${
                    pkg.popular 
                      ? 'ring-4 ring-yellow-400/50 bg-gradient-to-br from-yellow-50 to-white' 
                      : 'bg-white hover:bg-gray-50'
                  } rounded-2xl p-8 border border-gray-200`}
                  onClick={() => setSelectedPackage(index)}
                >
                  {/* Badge popular */}
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-1 rounded-full text-sm font-bold">
                        MAIS POPULAR
                      </div>
                    </div>
                  )}

                  {/* Header do card */}
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                      pkg.color === 'yellow' 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                        : pkg.color === 'red'
                        ? 'bg-gradient-to-br from-red-500 to-red-600'
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.title}</h3>
                    <p className="text-gray-600 mb-4">{pkg.subtitle}</p>
                    
                    <div className="text-center">
                      <span className="text-4xl font-black text-gray-900">R$ {pkg.price.toLocaleString()}</span>
                      <span className="text-lg text-gray-600">{pkg.unit}</span>
                      {pkg.minHours && (
                        <div className="text-sm text-gray-500 mt-1">
                          Mínimo {pkg.minHours} horas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-600 mb-6 text-center">{pkg.description}</p>

                  {/* Includes */}
                  <div className="space-y-3">
                    {pkg.includes.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calculadora de orçamento */}
          <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 text-white">
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-yellow-400/20 border border-yellow-400/30 rounded-full px-6 py-2 mb-4">
                <Calculator className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-yellow-400 font-bold text-sm tracking-wide">CALCULADORA DE ORÇAMENTO</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                Calcule o investimento do seu projeto
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Seletor de pacote */}
              <div>
                <label className="block text-yellow-400 font-bold mb-3">Modalidade Selecionada:</label>
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-white font-bold">{packages[selectedPackage].title}</div>
                  <div className="text-gray-300 text-sm">{packages[selectedPackage].subtitle}</div>
                </div>
              </div>

              {/* Seletor de horas (apenas para locação) */}
              {selectedPackage === 0 && (
                <div>
                  <label className="block text-yellow-400 font-bold mb-3">Horas de Locação:</label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setHours(Math.max(4, hours - 1))}
                      className="w-10 h-10 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-300 transition-colors"
                    >
                      -
                    </button>
                    <div className="text-2xl font-bold text-white min-w-[60px] text-center">
                      {hours}h
                    </div>
                    <button
                      onClick={() => setHours(hours + 1)}
                      className="w-10 h-10 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-300 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-gray-400 text-sm mt-2">Mínimo 4 horas</div>
                </div>
              )}

              {/* Resultado */}
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6">
                  <div className="text-black text-sm font-bold mb-1">INVESTIMENTO TOTAL</div>
                  <div className="text-black text-3xl font-black">
                    R$ {calculatePrice(selectedPackage, hours).toLocaleString()}
                  </div>
                  <button
                    onClick={scrollToQuote}
                    className="mt-4 bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 transition-colors"
                  >
                    Solicitar Orçamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudioUsageModalities;