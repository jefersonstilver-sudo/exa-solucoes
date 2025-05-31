
import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const HeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToNext = () => {
    const nextSection = document.querySelector('#about-section');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden snap-start" id="hero-section">
      {/* Vídeo de fundo */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
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

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

      {/* Conteúdo central */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 md:px-8">
        <div className={`transform transition-all duration-1500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Título principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="block">Publicidade que</span>
            <span className="block bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">
              sobe com o seu cliente.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
            Os elevadores da cidade agora são vitrines inteligentes.<br />
            <span className="text-indexa-mint font-medium">Conheça os Painéis da Indexa.</span>
          </p>
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
