import React from 'react';
import { useNavigate } from 'react-router-dom';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-purple-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center">
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-exo-2 font-light text-white/90 mb-10 sm:mb-12 lg:mb-16 leading-relaxed tracking-wide">
          Se você é síndico, veja como modernizar seu prédio
        </p>
        
        <button
          onClick={handleSindicoClick}
          className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white font-exo-2 font-bold py-4 sm:py-5 px-10 sm:px-12 rounded-lg text-lg sm:text-xl lg:text-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 min-h-[56px] touch-manipulation tracking-wide shadow-2xl hover:shadow-cyan-500/25"
        >
          Modernizar Meu Prédio
        </button>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;