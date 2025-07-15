import React, { useState, useEffect, useRef } from 'react';
import { Camera, Monitor, Lightbulb, Mic, Film, Settings, Eye, Award } from 'lucide-react';

const SuperStudioInfrastructure = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeEquipment, setActiveEquipment] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const studioVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo";

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

  const equipment = [
    {
      icon: Camera,
      category: 'CÂMERAS CINEMATOGRÁFICAS',
      title: 'RED Dragon/Komodo + Blackmagic 6K',
      specs: ['Gravação 6K/8K cinematográfica', 'Sensor full-frame profissional', 'Global shutter 120fps', '16+ stops de range dinâmico'],
      highlight: 'Mesma tecnologia de Hollywood'
    },
    {
      icon: Monitor,
      category: 'CHROMA KEY PROFISSIONAL',
      title: 'Estúdio Chroma Key 65m²',
      specs: ['Fundo verde profissional', 'Iluminação específica', 'Recorte em tempo real', '100+ cenários virtuais'],
      highlight: 'Cenário infinito'
    },
    {
      icon: Settings,
      category: 'TELEPROMPTER ÚLTIMA GERAÇÃO',
      title: 'Sistema Teleprompter Exclusivo',
      specs: ['Visualização de slides e vídeos', 'Controle remoto', 'Múltiplas posições', 'Adaptável para qualquer ângulo'],
      highlight: 'Apresentações naturais'
    },
    {
      icon: Lightbulb,
      category: 'ILUMINAÇÃO CINEMATOGRÁFICA',
      title: 'Sistema LED Profissional',
      specs: ['Painéis Amaran RGB', 'Controle DMX', 'Temperatura 3200K-6500K', 'Iluminação adaptável'],
      highlight: 'Qualidade broadcast'
    },
    {
      icon: Mic,
      category: 'ÁUDIO PROFISSIONAL',
      title: 'Captação e Tratamento',
      specs: ['Microfones direcionais', 'Microfones de lapela', 'Gravadores Zoom', 'Isolamento acústico'],
      highlight: 'Som cristalino'
    },
    {
      icon: Film,
      category: 'PÓS-PRODUÇÃO',
      title: 'Edição Final Cut + DaVinci',
      specs: ['Workstation profissional', 'Color grading cinematográfico', 'Mixagem de áudio', 'Renderização 4K/6K'],
      highlight: 'Finalização premium'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEquipment((prev) => (prev + 1) % equipment.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [equipment.length]);

  return (
    <section 
      id="super-studio-section"
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-black to-gray-900 text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Header cinematográfico */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-400/20 to-red-600/20 border border-yellow-400/30 rounded-full px-6 py-2 mb-8">
              <Award className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-bold text-sm tracking-wide">TECNOLOGIA CINEMATOGRÁFICA</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              NOSSO SUPER
              <span className="block bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
                ESTÚDIO
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Tecnologia de ponta ao seu alcance. Equipamentos profissionais para 
              produções com <span className="text-yellow-400 font-bold">qualidade cinematográfica</span>
            </p>
          </div>

          {/* Layout principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Vídeo do estúdio */}
            <div className="relative">
              <div className="aspect-[9/16] max-w-md mx-auto lg:max-w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-400/20">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src={studioVideoSrc} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              {/* Decoração */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-yellow-400 to-red-600 rounded-full blur-2xl opacity-30 animate-pulse" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-red-600 to-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />
            </div>

            {/* Equipamentos interativos */}
            <div className="space-y-6">
              {equipment.map((item, index) => {
                const IconComponent = item.icon;
                const isActive = index === activeEquipment;
                
                return (
                  <div
                    key={index}
                    className={`group cursor-pointer transition-all duration-500 ${
                      isActive 
                        ? 'bg-gradient-to-r from-yellow-400/20 to-red-600/20 border-yellow-400/50 scale-105' 
                        : 'bg-gray-800/50 border-gray-700/50 hover:border-yellow-400/30'
                    } border rounded-2xl p-6 backdrop-blur-sm`}
                    onClick={() => setActiveEquipment(index)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-yellow-400 to-red-600' 
                          : 'bg-gray-700 group-hover:bg-yellow-400/20'
                      }`}>
                        <IconComponent className={`w-7 h-7 ${isActive ? 'text-black' : 'text-yellow-400'}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className={`text-xs font-bold tracking-wide mb-1 ${
                          isActive ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          {item.category}
                        </div>
                        <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                          isActive ? 'text-white' : 'text-gray-300'
                        }`}>
                          {item.title}
                        </h3>
                        
                        {isActive && (
                          <div className="space-y-2 animate-fade-in">
                            {item.specs.map((spec, specIndex) => (
                              <div key={specIndex} className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                                <span className="text-sm text-gray-300">{spec}</span>
                              </div>
                            ))}
                            <div className="mt-3 inline-flex items-center bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                              <Eye className="w-3 h-3 mr-1" />
                              {item.highlight}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indicadores de progresso */}
          <div className="flex justify-center mt-12 space-x-2">
            {equipment.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeEquipment 
                    ? 'bg-yellow-400 scale-125' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                onClick={() => setActiveEquipment(index)}
              />
            ))}
          </div>

          {/* CTA final */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-red-600 p-1 rounded-2xl">
              <div className="bg-black px-8 py-4 rounded-xl">
                <p className="text-xl font-bold text-white">
                  Onde ideias viram <span className="text-yellow-400">cinema profissional</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuperStudioInfrastructure;