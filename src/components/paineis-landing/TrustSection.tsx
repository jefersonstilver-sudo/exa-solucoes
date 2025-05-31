
import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const TrustSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [revealedLogos, setRevealedLogos] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Marcas fictícias/genéricas com hover reveal
  const trustedBrands = [
    {
      name: 'Restaurante Premium',
      category: 'Gastronomia',
      result: '+180% movimento nos fins de semana',
      logo: 'R'
    },
    {
      name: 'Clínica Estética',
      category: 'Saúde & Beleza', 
      result: '+250% agendamentos novos',
      logo: 'C'
    },
    {
      name: 'Academia Fitness',
      category: 'Fitness',
      result: '+120% matrículas mensais',
      logo: 'A'
    },
    {
      name: 'Escola de Idiomas',
      category: 'Educação',
      result: '+200% procura por cursos',
      logo: 'E'
    },
    {
      name: 'Loja de Móveis',
      category: 'Casa & Decoração',
      result: '+150% vendas de móveis planejados',
      logo: 'L'
    },
    {
      name: 'Consultório Odontológico',
      category: 'Saúde',
      result: '+300% novos pacientes',
      logo: 'O'
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

  const handleLogoHover = (index: number) => {
    if (!revealedLogos.includes(index)) {
      setRevealedLogos(prev => [...prev, index]);
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Quem confia já está dentro
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 max-w-4xl mx-auto leading-relaxed">
            Empresas que investiram nos painéis e viram resultados reais
          </p>

          {/* Grid de Marcas com Hover Reveal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {trustedBrands.map((brand, index) => {
              const isRevealed = revealedLogos.includes(index);
              
              return (
                <div
                  key={index}
                  className={`group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-indexa-mint/50 transform transition-all duration-700 hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                  onMouseEnter={() => handleLogoHover(index)}
                >
                  {/* Logo Placeholder com Reveal */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500 ${
                      isRevealed 
                        ? 'bg-gradient-to-br from-indexa-purple to-indexa-mint text-white scale-110' 
                        : 'bg-gray-700 text-gray-400 blur-sm'
                    }`}>
                      {isRevealed ? brand.logo : '?'}
                    </div>
                    
                    {/* Ícone de revelação */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 bg-indexa-mint rounded-full flex items-center justify-center transition-all duration-500 ${
                      isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}>
                      <Eye className="w-3 h-3 text-white" />
                    </div>

                    {/* Indicador de hover para não reveladas */}
                    {!isRevealed && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-indexa-mint/80 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-white text-xs font-medium">Passe o mouse</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações da marca */}
                  <div className={`transition-all duration-500 ${
                    isRevealed ? 'opacity-100' : 'opacity-60 blur-sm'
                  }`}>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isRevealed ? brand.name : 'Marca Confiante'}
                    </h3>
                    
                    <p className="text-indexa-mint text-sm font-medium mb-3">
                      {brand.category}
                    </p>
                    
                    <p className="text-white/80 text-sm leading-relaxed">
                      {isRevealed ? brand.result : 'Resultados surpreendentes confirmados'}
                    </p>
                  </div>

                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indexa-mint/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl" />
                  
                  {/* Badge de sucesso */}
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-500 ${
                    isRevealed ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                </div>
              );
            })}
          </div>

          {/* Estatísticas de Sucesso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30">
              <div className="text-3xl font-bold text-indexa-mint mb-2">95%</div>
              <p className="text-white/80">Taxa de renovação de campanhas</p>
            </div>
            
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30">
              <div className="text-3xl font-bold text-indexa-mint mb-2">+180%</div>
              <p className="text-white/80">Aumento médio de visibilidade</p>
            </div>
            
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30">
              <div className="text-3xl font-bold text-indexa-mint mb-2">48h</div>
              <p className="text-white/80">Tempo médio para ver primeiros resultados</p>
            </div>
          </div>

          {/* Depoimento Destacado */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-indexa-purple/30 to-indexa-mint/30 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30">
              <div className="text-4xl text-indexa-mint mb-4">"</div>
              <p className="text-xl text-white/90 leading-relaxed mb-6 italic">
                "Em 30 dias nos painéis da Indexa, nossa marca ficou mais conhecida do que em 6 meses de redes sociais. 
                A diferença é que aqui as pessoas prestam atenção de verdade."
              </p>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-indexa-mint rounded-full flex items-center justify-center text-indexa-purple-dark font-bold mr-4">
                  M
                </div>
                <div>
                  <p className="text-white font-bold">Empresário Local</p>
                  <p className="text-indexa-mint text-sm">Setor Alimentício</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
