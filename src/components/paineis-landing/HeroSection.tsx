
import React, { useState, useEffect } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const scrollToNext = () => {
    const nextSection = document.querySelector('#about-section');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCTAClick = () => {
    navigate('/paineis-digitais/loja');
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden snap-start bg-gradient-to-br from-gray-900 via-purple-900 to-black" id="hero-section">
      {/* Textura de fundo */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 h-full min-h-screen flex items-center justify-center px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Texto - Lado esquerdo no desktop, acima no mobile */}
          <div className={`order-2 lg:order-1 text-center lg:text-left transform transition-all duration-1500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {/* Título principal com animação */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="block">Publicidade que</span>
              <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent animate-pulse-soft">
                sobe com o seu cliente.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-light">
              Os elevadores da cidade agora são vitrines inteligentes.<br />
              <span className="text-indexa-mint font-medium">Conheça os Painéis da Indexa.</span>
            </p>

            {/* Selo de destaque */}
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-white/20">
              <div className="w-2 h-2 bg-indexa-mint rounded-full mr-3 animate-pulse" />
              <span className="text-white text-sm font-medium">Exibição média: 245 vezes ao dia por painel</span>
            </div>

            {/* Botão CTA com efeito pulse-glow */}
            <button
              onClick={handleCTAClick}
              className="group relative bg-indexa-mint text-indexa-purple-dark text-lg font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 animate-pulse-soft"
            >
              <span className="relative flex items-center space-x-3">
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Acessar Loja Online</span>
              </span>
              
              {/* Efeito pulse-glow */}
              <div className="absolute inset-0 bg-indexa-mint/30 rounded-full animate-ping" />
            </button>
          </div>

          {/* Vídeo em moldura de painel - Lado direito no desktop, acima no mobile */}
          <div className={`order-1 lg:order-2 flex justify-center transform transition-all duration-1500 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="relative group">
              {/* Moldura do painel digital */}
              <div className="relative bg-gray-800 p-3 rounded-2xl shadow-2xl border border-gray-700">
                {/* Sombra externa para profundidade */}
                <div className="absolute inset-0 bg-indexa-mint/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70" />
                
                {/* Vídeo */}
                <div className="relative overflow-hidden rounded-xl">
                  <video
                    className="w-full max-w-md h-96 object-cover rounded-xl"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  >
                    <source 
                      src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc0ODY1MTk1MywiZXhwIjoyMDY0MDExOTUzfQ.LOZ9ZkHKPoAATrM6egV9XCnKjI1vcSirbhM57eeC6eY" 
                      type="video/mp4"
                    />
                  </video>
                  
                  {/* Efeito de tela iluminada */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none" />
                </div>

                {/* Indicadores LED do painel */}
                <div className="absolute top-1 right-1 flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToNext}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white hover:text-indexa-mint transition-colors duration-300 animate-bounce"
          aria-label="Rolar para baixo"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
