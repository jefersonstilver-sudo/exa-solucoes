
import React from 'react';
import { Coffee } from 'lucide-react';

interface MarketingHeroProps {
  onScrollToForm: () => void;
}

const MarketingHero: React.FC<MarketingHeroProps> = ({
  onScrollToForm
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      {/* Enhanced Background Video */}
      <div className="absolute inset-0 z-0">
        <video className="w-full h-full object-cover opacity-40 blur-sm" autoPlay loop muted playsInline preload="auto">
          <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos/video%20fundo%20indexa.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MvdmlkZW8gZnVuZG8gaW5kZXhhLm1wNCIsImlhdCI6MTczMzI0MjU1MywiZXhwIjoxNzY0Nzc4NTUzfQ.k7bxrSjQrTqnpgL_JwYP5-NVL-67I9lrPLdgQE5hzP8" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-purple-800/60 to-indigo-900/80" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="text-center text-white">
          <h1 className="mb-8 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="block mb-2 bg-gradient-to-r from-white via-indexa-mint to-white bg-clip-text text-transparent animate-fade-in">Marketing com estratégia, presença e impacto real.</span>
            <span className="block mb-2 bg-gradient-to-r from-indexa-mint via-indexa-purple to-indexa-mint bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.5s' }}>Campanhas completas para marcas que querem crescer.</span>
          </h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '1s' }}>
            <p className="text-xl md:text-2xl text-indexa-mint font-semibold">
              Planejamento, execução e performance no mesmo lugar.
            </p>
          </div>

          <div className="mt-8">
            <button onClick={onScrollToForm} className="bg-gradient-to-r from-indexa-mint to-indexa-purple text-white hover:scale-105 hover:shadow-2xl hover:shadow-indexa-mint/50 transform transition-all duration-300 px-10 py-5 text-lg rounded-full font-semibold flex items-center mx-auto group animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <Coffee className="mr-3 h-6 w-6 group-hover:animate-bounce" />
              <span>Solicitar Diagnóstico Gratuito</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
