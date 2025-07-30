import React, { useState, useEffect } from 'react';
import { Play, Camera } from 'lucide-react';
const ProdutoraHeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);
  const heroVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo";
  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);
  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById('portfolio-section');
    portfolioSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const scrollToCafe = () => {
    const cafeSection = document.getElementById('cafe-section');
    cafeSection?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <section className="relative min-h-[100vh] sm:min-h-[90vh] md:h-[80vh] w-full overflow-hidden pt-16 sm:pt-20">
      {/* Vídeo de fundo com blur intenso */}
      <div className="absolute inset-0 z-0">
        <video className="w-full h-full object-cover blur-lg" autoPlay loop muted playsInline>
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(90vh-5rem)] md:h-[calc(80vh-5rem)] px-4 py-8">
        <div className="text-center max-w-5xl mx-auto">
          {/* Frase principal com animação de escrita */}
          <div className={`transform transition-all duration-1000 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="font-playfair text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              
            </h1>
            <p className="font-montserrat text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light leading-relaxed max-w-4xl mx-auto px-2">
              Unimos tecnologia de ponta e criatividade humanizada para criar vídeos profissionais que capturam a essência da sua marca.
            </p>
          </div>

          {/* Botões CTA */}
          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 transform transition-all duration-1000 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <button onClick={scrollToPortfolio} className="group bg-indexa-mint text-indexa-purple-dark font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 w-full sm:w-auto text-sm sm:text-base">
              <span className="flex items-center justify-center space-x-2">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                <span className="whitespace-nowrap">Ver Portfólio Exclusivo</span>
              </span>
            </button>
            
            <button onClick={scrollToCafe} className="group bg-white/10 backdrop-blur-sm text-white border border-white/30 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full hover:bg-white/20 transform transition-all duration-500 hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
              <span className="flex items-center justify-center space-x-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="whitespace-nowrap">Agendar Café com a Produtora</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>;
};
export default ProdutoraHeroSection;