import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 overflow-hidden">
      {/* Background Video */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30"
        poster="/assets/video-thumbnail.jpg"
      >
        <source src="/assets/hero-video.mp4" type="video/mp4" />
      </video>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-7xl font-bold leading-tight mb-8">
          <span className="block text-[#00FFAB]">LINKAÊ</span>
          <span className="block text-2xl md:text-4xl font-normal mt-4">
            Social Media que converte
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto opacity-90">
          Criamos conteúdo estratégico para redes sociais que gera engajamento real e resultados mensuráveis para sua marca.
        </p>
        
        <button
          onClick={onScrollToForm}
          className="bg-gradient-to-r from-[#00FFAB] to-[#00B377] text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center mx-auto space-x-2"
        >
          <Coffee className="w-5 h-5" />
          <span>Conversar sobre Social Media</span>
        </button>
      </div>
    </section>
  );
};

export default LinkaeHero;