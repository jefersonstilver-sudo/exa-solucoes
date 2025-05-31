
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, CheckCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FinalCTASection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const benefits = [
    'Sem compromissos longos',
    'Configuração rápida',
    'Suporte especializado'
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

  const handleCTAClick = () => {
    setRippleKey(prev => prev + 1);
    setTimeout(() => {
      navigate('/paineis-digitais/loja');
    }, 300);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-black flex items-center justify-center py-20 px-4 relative overflow-hidden"
    >
      {/* Efeitos de fundo animados */}
      <div className="absolute inset-0">
        {/* Partículas flutuantes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-indexa-mint/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-indexa-purple/10 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indexa-mint/5 to-indexa-purple/5 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Grid de fundo sutil */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2358E3AB' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone decorativo com coroa */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center">
                <Crown className="w-12 h-12 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-indexa-mint animate-pulse" />
              <div className="absolute inset-0 bg-indexa-mint/20 blur-xl rounded-full animate-ping" />
            </div>
          </div>

          {/* Título Principal Impactante */}
          <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Está na hora da sua marca
            <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              ocupar o elevador certo.
            </span>
          </h2>

          {/* Subtítulo Motivacional */}
          <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Transforme elevadores em vitrines digitais e alcance seu público no 
            <span className="text-indexa-mint font-bold"> momento perfeito.</span>
          </p>

          {/* Estatística de Impacto */}
          <div className="bg-gradient-to-r from-indexa-purple/30 to-indexa-mint/30 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 mb-12 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-1">245</div>
                <div className="text-white/80 text-sm">visualizações/dia</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-1">22k</div>
                <div className="text-white/80 text-sm">pessoas atingidas</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-indexa-mint mb-1">95%</div>
                <div className="text-white/80 text-sm">taxa de atenção</div>
              </div>
            </div>
          </div>

          {/* Botão CTA Gigante com múltiplos efeitos */}
          <div className="relative inline-block mb-8">
            <button
              onClick={handleCTAClick}
              className="group relative bg-gradient-to-r from-indexa-mint via-indexa-purple to-indexa-mint text-white text-2xl md:text-3xl font-bold py-8 px-16 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-110 hover:-translate-y-2 overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #58E3AB, #4A0968, #58E3AB)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite'
              }}
            >
              {/* Efeito ripple */}
              <div 
                key={rippleKey}
                className="absolute inset-0 bg-white/20 rounded-full animate-ping"
                style={{ animationDuration: '0.6s' }}
              />
              
              {/* Conteúdo do botão */}
              <span className="relative flex items-center space-x-4 z-10">
                <span>Acessar Loja Online</span>
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
              </span>

              {/* Brilho deslizante */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>

            {/* Sombras pulsantes externas */}
            <div className="absolute inset-0 bg-indexa-mint/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-0 bg-indexa-purple/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Lista de benefícios com ícones */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 text-lg mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-indexa-mint" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Urgência e escassez */}
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm p-4 rounded-xl border border-red-400/30 mb-12 max-w-lg mx-auto">
            <p className="text-red-300 font-bold text-lg mb-1">⏰ Oportunidade limitada</p>
            <p className="text-white/80">Apenas 3 vagas restantes por segmento nesta região</p>
          </div>

          {/* Garantia */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-green-500/20 backdrop-blur-sm px-6 py-3 rounded-full border border-green-400/30">
              <Shield className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-green-300 font-medium">Garantia de 30 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/40 text-sm text-center">
        <p>© 2025 Indexa Mídia. Todos os direitos reservados.</p>
      </div>
    </section>
  );
};

export default FinalCTASection;
