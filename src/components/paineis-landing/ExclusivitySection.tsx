
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExclusivitySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lockAnimation, setLockAnimation] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setTimeout(() => setLockAnimation(true), 1000);
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
      className="min-h-screen bg-gradient-to-br from-indexa-purple-dark via-black to-indexa-purple flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-6xl mx-auto text-center">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Ícone de Cadeado Central Animado */}
          <div className="mb-12">
            <div className={`relative inline-block transform transition-all duration-1000 ${
              lockAnimation ? 'scale-110' : 'scale-100'
            }`}>
              <div className="w-32 h-32 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <Lock className={`w-16 h-16 text-white transform transition-all duration-1000 ${
                  lockAnimation ? 'rotate-12' : 'rotate-0'
                }`} />
              </div>
              
              {/* Anéis de energia pulsantes */}
              <div className="absolute inset-0 rounded-full bg-indexa-mint/20 animate-ping" />
              <div className="absolute inset-4 rounded-full bg-indexa-purple/20 animate-pulse delay-300" />
              
              {/* Efeito de brilho */}
              <div className="absolute inset-0 bg-gradient-to-r from-indexa-mint/30 to-indexa-purple/30 rounded-full blur-xl" />
            </div>
          </div>

          {/* Título Principal */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Exclusividade por Segmento
            </span>
          </h2>

          {/* Subtítulo */}
          <p className="text-2xl md:text-3xl text-white/90 mb-12 leading-relaxed font-light">
            Ao reservar agora, você <span className="text-indexa-mint font-bold">bloqueia seu segmento</span><br />
            e impede a concorrência
          </p>

          {/* Grid de Vantagens da Exclusividade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className={`bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '400ms' }}>
              <Shield className="w-12 h-12 text-indexa-mint mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Proteção Total</h3>
              <p className="text-white/80 text-sm">
                Seu segmento fica protegido por todo o período contratado. 
                Concorrentes não podem anunciar na mesma categoria.
              </p>
            </div>

            <div className={`bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '600ms' }}>
              <Crown className="w-12 h-12 text-indexa-mint mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Posição de Liderança</h3>
              <p className="text-white/80 text-sm">
                Seja reconhecido como a marca líder do seu segmento. 
                Primeiro a investir, primeiro a ser lembrado.
              </p>
            </div>

            <div className={`bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-indexa-mint/30 transform transition-all duration-700 hover:scale-105 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '800ms' }}>
              <Zap className="w-12 h-12 text-indexa-mint mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Impacto Máximo</h3>
              <p className="text-white/80 text-sm">
                Sem concorrência no mesmo espaço, sua marca recebe 
                100% da atenção do público-alvo.
              </p>
            </div>
          </div>

          {/* Ilustração do Conceito */}
          <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Lado Esquerdo - Problema */}
              <div className="text-left">
                <h3 className="text-2xl font-bold text-red-400 mb-4">❌ Publicidade Tradicional</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Competição direta com concorrentes</li>
                  <li>• Múltiplas marcas no mesmo espaço</li>
                  <li>• Atenção dividida do público</li>
                  <li>• Menor impacto por exposição</li>
                </ul>
              </div>

              {/* Lado Direito - Solução */}
              <div className="text-left">
                <h3 className="text-2xl font-bold text-indexa-mint mb-4">✅ Painéis Indexa</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Exclusividade por segmento garantida</li>
                  <li>• Apenas sua marca no seu nicho</li>
                  <li>• Atenção total do público</li>
                  <li>• Máximo impacto por exposição</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA de Urgência */}
          <div className="relative">
            <button
              onClick={handleCTAClick}
              className="group relative bg-gradient-to-r from-indexa-mint to-indexa-purple text-white text-xl font-bold py-6 px-12 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative flex items-center space-x-3 z-10">
                <Lock className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span>Reservar Minha Exclusividade</span>
              </span>
              
              {/* Efeito pulse */}
              <div className="absolute inset-0 bg-indexa-mint/30 rounded-full animate-ping" />
            </button>

            {/* Texto de urgência */}
            <p className="text-indexa-mint/80 text-sm mt-4 font-medium">
              Vagas limitadas por segmento • Primeiro a reservar, primeiro a dominar
            </p>
          </div>

          {/* Tag de Segmento Exclusivo */}
          <div className="mt-12 inline-flex items-center bg-gradient-to-r from-indexa-purple to-indexa-mint px-6 py-3 rounded-full">
            <Crown className="w-5 h-5 text-white mr-2" />
            <span className="text-white font-bold">SEGMENTO EXCLUSIVO</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExclusivitySection;
