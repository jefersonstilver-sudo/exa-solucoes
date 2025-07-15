import React, { useState, useEffect, useRef } from 'react';
import { Building, Megaphone, GraduationCap, Mic, Video, Briefcase } from 'lucide-react';

const ProductionTypesShowcase = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeType, setActiveType] = useState(0);
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

  const productionTypes = [
    {
      icon: Building,
      title: 'Vídeos Corporativos e Institucionais',
      subtitle: 'Eleve sua marca com narrativas poderosas',
      description: 'Filmes manifesto e apresentações executivas com qualidade cinematográfica',
      features: [
        'Filmes manifesto com narrativas profundas',
        'Vídeos de treinamento com chroma key',
        'Apresentações executivas com teleprompter',
        'Vídeos de cultura organizacional',
        'Relatórios anuais cinematográficos'
      ],
      examples: ['Missão, visão e valores', 'Onboarding de colaboradores', 'Comunicação interna'],
      color: 'blue',
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      icon: Megaphone,
      title: 'Comerciais e Publicitários',
      subtitle: 'Campanhas que convertem e vendem',
      description: 'Spots comerciais com qualidade de cinema para TV e digital',
      features: [
        'Spots comerciais para TV e digital',
        'Campanhas de produto com cenários virtuais',
        'Vídeos para redes sociais otimizados',
        'Campanhas sazonais e promocionais',
        'Publicidade para e-commerce'
      ],
      examples: ['Lançamento de produtos', 'Black Friday', 'Campanhas de brand'],
      color: 'red',
      gradient: 'from-red-500 to-red-700'
    },
    {
      icon: GraduationCap,
      title: 'Conteúdo Educacional',
      subtitle: 'Transforme conhecimento em experiência',
      description: 'Videoaulas e cursos online com ambiente controlado e qualidade superior',
      features: [
        'Videoaulas profissionais multi-câmera',
        'Cursos online com qualidade broadcast',
        'Palestras e workshops ao vivo',
        'Conteúdo para EAD',
        'Treinamentos corporativos'
      ],
      examples: ['Cursos online', 'Webinars', 'Treinamentos técnicos'],
      color: 'green',
      gradient: 'from-green-500 to-green-700'
    },
    {
      icon: Mic,
      title: 'Podcasts e Videocasts',
      subtitle: 'Audio e vídeo com qualidade profissional',
      description: 'Ambiente acústico perfeito com cenários moduláveis',
      features: [
        'Ambiente acústico tratado profissionalmente',
        'Cenários moduláveis para diferentes formatos',
        'Múltiplas câmeras para edição dinâmica',
        'Streaming ao vivo para plataformas',
        'Gravação em alta qualidade'
      ],
      examples: ['Podcasts corporativos', 'Entrevistas', 'Talk shows'],
      color: 'purple',
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      icon: Video,
      title: 'Conteúdo para Redes Sociais',
      subtitle: 'Formatos otimizados para cada plataforma',
      description: 'Produção especializada em formatos verticais e horizontais',
      features: [
        'Reels e Stories em formato vertical',
        'Vídeos para YouTube e LinkedIn',
        'Conteúdo para TikTok e Instagram',
        'Lives e transmissões ao vivo',
        'Conteúdo multiplataforma'
      ],
      examples: ['Reels virais', 'YouTube Shorts', 'LinkedIn video'],
      color: 'pink',
      gradient: 'from-pink-500 to-pink-700'
    },
    {
      icon: Briefcase,
      title: 'Eventos e Transmissões',
      subtitle: 'Cobertura completa de eventos',
      description: 'Transmissões ao vivo com qualidade broadcast',
      features: [
        'Cobertura completa de eventos',
        'Transmissão multi-plataforma',
        'Gravação para posterior edição',
        'Cenografia e ambientação',
        'Suporte técnico completo'
      ],
      examples: ['Lançamentos', 'Convenções', 'Webinars'],
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-700'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveType((prev) => (prev + 1) % productionTypes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [productionTypes.length]);

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-gray-900 to-black text-white"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-400/20 to-red-600/20 border border-yellow-400/30 rounded-full px-6 py-2 mb-8">
              <Video className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-bold text-sm tracking-wide">TIPOS DE PRODUÇÃO</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              PRODUÇÕES
              <span className="block bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent">
                CINEMATOGRÁFICAS
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Atendemos todos os tipos de produção com qualidade cinematográfica e expertise técnica
            </p>
          </div>

          {/* Grid de tipos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {productionTypes.map((type, index) => {
              const IconComponent = type.icon;
              const isActive = index === activeType;
              
              return (
                <div
                  key={index}
                  className={`group cursor-pointer transition-all duration-500 ${
                    isActive 
                      ? 'scale-105 bg-gradient-to-br from-gray-800 to-gray-900 ring-2 ring-yellow-400/50' 
                      : 'bg-gray-800/50 hover:bg-gray-800/80'
                  } rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-400/30`}
                  onClick={() => setActiveType(index)}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${type.gradient}`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {type.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4">{type.subtitle}</p>
                  
                  <div className="space-y-2">
                    {type.examples.map((example, exIndex) => (
                      <div key={exIndex} className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                        <span className="text-gray-300 text-sm">{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detalhes do tipo ativo */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className={`inline-flex items-center bg-gradient-to-r ${productionTypes[activeType].gradient} rounded-full px-4 py-2 mb-4`}>
                  <span className="text-white font-bold text-sm">{productionTypes[activeType].title.toUpperCase()}</span>
                </div>
                
                <h3 className="text-3xl font-bold text-white mb-4">
                  {productionTypes[activeType].subtitle}
                </h3>
                
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  {productionTypes[activeType].description}
                </p>

                <button className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-3 px-8 rounded-full hover:from-yellow-300 hover:to-yellow-500 transition-all duration-300 transform hover:scale-105">
                  Solicitar Orçamento
                </button>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-yellow-400 mb-4">O que produzimos:</h4>
                {productionTypes[activeType].features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
                  >
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indicadores */}
          <div className="flex justify-center mt-8 space-x-2">
            {productionTypes.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === activeType 
                    ? 'bg-yellow-400 scale-125' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                onClick={() => setActiveType(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductionTypesShowcase;