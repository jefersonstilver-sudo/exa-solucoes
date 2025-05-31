
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

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

  const handleCTAClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-indexa-purple via-indexa-purple-dark to-black flex items-center justify-center py-20 px-4 snap-start relative overflow-hidden"
      id="cta-section"
    >
      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-indexa-mint/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-indexa-mint/5 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indexa-mint/5 to-transparent rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone decorativo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-indexa-mint animate-pulse" />
              <div className="absolute inset-0 bg-indexa-mint/20 blur-xl rounded-full" />
            </div>
          </div>

          {/* Título principal */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Quer impactar o público certo,
            <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              todos os dias?
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transforme elevadores em vitrines digitais e alcance seu público no momento perfeito.
          </p>

          {/* Botão CTA principal */}
          <div className="relative inline-block">
            <button
              onClick={handleCTAClick}
              className="group relative bg-white text-indexa-purple text-xl font-bold py-6 px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/25 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              {/* Efeito de borda animada */}
              <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint to-indexa-purple rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              
              {/* Conteúdo do botão */}
              <span className="relative flex items-center space-x-3">
                <span>Acessar Loja Online</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>

              {/* Efeito de brilho */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {/* Pulso de fundo */}
            <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
          </div>

          {/* Texto de apoio */}
          <p className="text-white/60 mt-8 text-sm">
            Sem compromissos • Configuração rápida • Suporte especializado
          </p>
        </div>
      </div>

      {/* Rodapé simples */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/40 text-sm">
        © 2025 Indexa Mídia. Todos os direitos reservados.
      </div>
    </section>
  );
};

export default CTASection;
