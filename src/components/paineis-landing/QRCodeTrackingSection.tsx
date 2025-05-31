
import React, { useState, useEffect, useRef } from 'react';
import { QrCode, BarChart3, Eye, Target, TrendingUp, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRCodeTrackingSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const trackingFeatures = [
    {
      icon: QrCode,
      title: 'QR Code Personalizado',
      description: 'Cada campanha recebe um QR code único para rastreamento',
      details: 'Códigos exclusivos que direcionam para sua landing page, site ou promoção específica',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Eye,
      title: 'Escaneamentos em Tempo Real',
      description: 'Monitore quantas vezes seu QR code foi escaneado',
      details: 'Acompanhe cada escaneamento com data, hora e localização do painel onde ocorreu',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Relatórios Detalhados',
      description: 'Análises completas do engajamento do público',
      details: 'Gráficos e métricas que mostram performance por prédio, horário e dia da semana',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: Target,
      title: 'Mapeamento de Interesse',
      description: 'Identifique quais locais geram mais engajamento',
      details: 'Descubra os pontos mais efetivos para otimizar futuras campanhas e investimentos',
      color: 'from-orange-500 to-red-500'
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

  // Auto-cycle através das features
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % trackingFeatures.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, trackingFeatures.length]);

  const handleCTAClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-indexa-purple-dark via-black to-indexa-purple flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-6xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone Central Animado */}
          <div className="mb-12">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform rotate-6">
                <QrCode className="w-16 h-16 text-white" />
              </div>
              
              {/* Efeitos visuais */}
              <div className="absolute inset-0 rounded-2xl bg-indexa-mint/20 animate-ping" />
              <div className="absolute inset-4 rounded-xl bg-indexa-purple/20 animate-pulse delay-300" />
              
              {/* Smartphone escaneando */}
              <div className="absolute -top-4 -right-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg animate-bounce">
                  <Smartphone className="w-6 h-6 text-indexa-purple" />
                </div>
              </div>
            </div>
          </div>

          {/* Título Principal */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Rastreabilidade com QR Code
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="text-2xl md:text-3xl text-white/90 mb-12 leading-relaxed font-light">
            Sua marca agora tem <span className="text-indexa-mint font-bold">métricas precisas</span><br />
            de engajamento em cada painel
          </p>

          {/* Grid de Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {trackingFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <div
                  key={index}
                  className={`group relative transform transition-all duration-700 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  } ${isActive ? 'scale-105' : 'hover:scale-102'}`}
                  style={{ transitionDelay: `${index * 200}ms` }}
                  onClick={() => setActiveFeature(index)}
                >
                  {/* Card da feature */}
                  <div className={`relative bg-gradient-to-br ${feature.color} p-8 rounded-2xl shadow-2xl overflow-hidden ${
                    isActive ? 'ring-2 ring-indexa-mint ring-opacity-50' : ''
                  }`}>
                    {/* Efeito de iluminação */}
                    <div className={`absolute inset-0 bg-white/10 transition-opacity duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`} />
                    
                    {/* Ícone */}
                    <div className="relative mb-6">
                      <div className={`w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isActive ? 'scale-110 rotate-6' : 'scale-100'
                      }`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-xl font-bold text-white mb-3">
                      {feature.title}
                    </h3>

                    {/* Descrição */}
                    <p className="text-white/90 text-sm leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    {/* Detalhes expandidos */}
                    <div className={`overflow-hidden transition-all duration-500 ${
                      isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-white/80 text-xs leading-relaxed">
                          {feature.details}
                        </p>
                      </div>
                    </div>

                    {/* Indicador de status */}
                    <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-500 ${
                      isActive ? 'bg-green-400 animate-pulse' : 'bg-white/30'
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

          {/* Métricas de exemplo */}
          <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30 mb-12">
            <h3 className="text-2xl font-bold text-center text-white mb-8">
              <span className="text-indexa-mint">Exemplo de Métricas QR Code</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 text-indexa-mint mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">342</div>
                <div className="text-white/80 text-sm">Escaneamentos</div>
                <div className="text-green-400 text-xs">+23% esta semana</div>
              </div>
              
              <div className="text-center">
                <Eye className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">89%</div>
                <div className="text-white/80 text-sm">Taxa de conversão</div>
                <div className="text-green-400 text-xs">Acima da média</div>
              </div>
              
              <div className="text-center">
                <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">12</div>
                <div className="text-white/80 text-sm">Painéis ativos</div>
                <div className="text-white/60 text-xs">Em 8 prédios</div>
              </div>

              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">15h</div>
                <div className="text-white/80 text-sm">Pico de engajamento</div>
                <div className="text-white/60 text-xs">Horário comercial</div>
              </div>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="relative">
            <button
              onClick={handleCTAClick}
              className="group relative bg-gradient-to-r from-indexa-mint to-indexa-purple text-white text-xl font-bold py-6 px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative flex items-center space-x-3 z-10">
                <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span>Começar Rastreamento Agora</span>
              </span>
              
              {/* Efeito pulse */}
              <div className="absolute inset-0 bg-indexa-mint/30 rounded-full animate-ping" />
            </button>

            {/* Texto motivacional */}
            <p className="text-indexa-mint/80 text-sm mt-4 font-medium">
              Métricas precisas • Resultados mensuráveis • ROI comprovado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QRCodeTrackingSection;
