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
  return <>
    <section className="relative min-h-[100vh] sm:min-h-[90vh] md:h-[80vh] w-full overflow-hidden pt-16 sm:pt-20">
      {/* Vídeo de fundo com efeito vitrine */}
      <div className="absolute inset-0 z-0">
        <video className="w-full h-full object-cover" autoPlay loop muted playsInline>
          <source src={indexaVideoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>
    </section>

    {/* Seção dos botões embaixo do vídeo */}
    <section className="bg-white py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center transform transition-all duration-1000 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <button onClick={scrollToPortfolio} className="group bg-indexa-mint text-indexa-purple-dark font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 w-full sm:w-auto text-sm sm:text-base">
            <span className="flex items-center justify-center space-x-2">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
              <span className="whitespace-nowrap">Ver Portfólio Exclusivo</span>
            </span>
          </button>
          
          <button onClick={scrollToCafe} className="group bg-indexa-purple text-white border border-indexa-purple font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full hover:bg-indexa-purple/90 transform transition-all duration-500 hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
            <span className="flex items-center justify-center space-x-2">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="whitespace-nowrap">Agendar Café com a Produtora</span>
            </span>
          </button>
        </div>
      </div>
    </section>
  </>;
};
export default ProdutoraHeroSection;