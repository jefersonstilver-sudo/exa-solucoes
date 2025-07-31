import React, { useState, useEffect } from 'react';
import { Play, Camera } from 'lucide-react';
const ProdutoraHeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);
  const indexaVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/indexa%20lettr.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL2luZGV4YSBsZXR0ci5tcDQiLCJpYXQiOjE3NTM5MjU0NTcsImV4cCI6MTc4NTQ2MTQ1N30.y-klo_wvwItBeDzzHr6jq3aHQMWDumvwmh3jfJFi6WE";
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
      {/* Vídeo de fundo com efeito vitrine */}
      <div className="absolute inset-0 z-0">
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
          <source src={indexaVideoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col min-h-[calc(100vh-4rem)] sm:min-h-[calc(90vh-5rem)] md:h-[calc(80vh-5rem)] px-4 py-8">
        {/* Espaço superior para destacar o vídeo */}
        <div className="flex-grow-[3]"></div>
        
        <div className="text-center max-w-5xl mx-auto">
          {/* Frase principal com animação de escrita */}
          <div className={`transform transition-all duration-1000 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="font-playfair text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              
            </h1>
            <p className="font-montserrat text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light leading-relaxed max-w-4xl mx-auto px-2">
              Unimos tecnologia de ponta e criatividade humanizada para criar vídeos profissionais que capturam a essência da sua marca.
            </p>
          </div>
        </div>
        
        {/* Espaço menor entre texto e botões */}
        <div className="flex-grow"></div>
        
        {/* Botões CTA na parte inferior */}
        <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center transform transition-all duration-1000 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
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
        
        {/* Espaço inferior para não grudar na borda */}
        <div className="h-8 sm:h-12"></div>
      </div>
    </section>;
};
export default ProdutoraHeroSection;