
import React, { useState, useEffect } from 'react';
import { Play, Camera } from 'lucide-react';

const ProdutoraHeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);

  const heroVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MjkxOH0.-SBpzIuGOlz4Y7VjAqfPmGN1dHNwL_1nkIx9hGKEZ5M";

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById('portfolio-section');
    portfolioSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCafe = () => {
    const cafeSection = document.getElementById('cafe-section');
    cafeSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-20">
      {/* Vídeo de fundo com blur intenso */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover blur-lg"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/80" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Frase principal com animação de escrita */}
          <div className={`transform transition-all duration-1000 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="block mb-2">Sua marca com</span>
              <span className="block bg-gradient-to-r from-[#00B377] to-indexa-purple bg-clip-text text-transparent mb-2">
                linguagem de cinema.
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-700 font-light">
                Emocione. Conquiste. Venda.
              </span>
            </h1>
          </div>

          {/* Botões CTA */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 transform transition-all duration-1000 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button
              onClick={scrollToPortfolio}
              className="group bg-[#00B377] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-[#00B377]/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center space-x-2">
                <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span>Ver Portfólio Exclusivo</span>
              </span>
            </button>
            
            <button
              onClick={scrollToCafe}
              className="group bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-300 font-bold py-4 px-8 rounded-full hover:bg-white transform transition-all duration-500 hover:scale-105"
            >
              <span className="flex items-center space-x-2">
                <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Agendar Café com a Produtora</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProdutoraHeroSection;
