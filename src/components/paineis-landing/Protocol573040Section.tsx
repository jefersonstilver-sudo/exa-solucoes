
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Wifi, Server, AlertTriangle, CheckCircle } from 'lucide-react';

const Protocol573040Section = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const protocolFeatures = [
    {
      icon: Shield,
      title: 'Backup Automático',
      description: 'Sistema redundante garante operação contínua',
      details: 'Múltiplas camadas de backup mantêm seus anúncios sempre online, mesmo com falhas de energia ou rede',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wifi,
      title: 'Monitoramento 24/7',
      description: 'Supervisão constante de todos os painéis',
      details: 'Equipe técnica monitora cada painel em tempo real, detectando e corrigindo problemas automaticamente',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Server,
      title: 'Recuperação Instantânea',
      description: 'Reativação automática em caso de falhas',
      details: 'Protocolos inteligentes reestabelecem conexão e reprodução em segundos, sem perder exibições',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: AlertTriangle,
      title: 'Proteção Contra Ataques',
      description: 'Segurança digital avançada',
      details: 'Firewall dedicado e criptografia impedem invasões ou manipulações maliciosas do sistema',
      color: 'from-red-500 to-orange-500'
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
        setActiveFeature((prev) => (prev + 1) % protocolFeatures.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, protocolFeatures.length]);

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-black via-indexa-purple-dark to-black flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Protocolo 573040
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Sistema de segurança avançado que mantém seus anúncios sempre ativos
          </p>

          {/* Explicação Visual Central */}
          <div className="text-center mb-16">
            <div className="relative inline-block">
              {/* Círculo central com ícone de escudo */}
              <div className="w-32 h-32 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Shield className="w-16 h-16 text-white" />
              </div>
              
              {/* Anéis de proteção animados */}
              <div className="absolute inset-0 rounded-full border-2 border-indexa-mint/30 animate-ping" />
              <div className="absolute -inset-4 rounded-full border-2 border-indexa-purple/20 animate-pulse delay-300" />
              <div className="absolute -inset-8 rounded-full border border-indexa-mint/10 animate-ping delay-700" />
              
              {/* Label do protocolo */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-indexa-purple/80 backdrop-blur-sm px-4 py-2 rounded-full border border-indexa-mint/30">
                  <span className="text-indexa-mint font-bold text-sm">PROTOCOLO ATIVO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {protocolFeatures.map((feature, index) => {
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

          {/* Garantias do Protocolo */}
          <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30">
            <h3 className="text-2xl font-bold text-center text-white mb-8">
              <span className="text-indexa-mint">Garantias do Protocolo 573040</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">99.9% Uptime</h4>
                <p className="text-white/80 text-sm">Funcionamento garantido 99.9% do tempo contratado</p>
              </div>
              
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Recuperação < 30s</h4>
                <p className="text-white/80 text-sm">Reativação automática em menos de 30 segundos</p>
              </div>
              
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Suporte 24/7</h4>
                <p className="text-white/80 text-sm">Monitoramento e suporte técnico 24 horas por dia</p>
              </div>
            </div>
          </div>

          {/* Indicadores de progresso */}
          <div className="flex justify-center mt-8 space-x-3">
            {protocolFeatures.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveFeature(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === activeFeature 
                    ? 'bg-indexa-mint scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Protocol573040Section;
