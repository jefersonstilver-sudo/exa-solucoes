import React from 'react';
import { useNavigate } from 'react-router-dom';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-gradient-to-br from-purple-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 text-center">
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-exo-2 font-light text-white/90 mb-6 sm:mb-8 lg:mb-10 leading-relaxed tracking-wide text-center">
          Se você é síndico, veja como modernizar seu prédio
        </p>
        
        <button
          onClick={handleSindicoClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold py-4 sm:py-5 px-10 sm:px-12 rounded-lg text-base sm:text-lg md:text-xl transition-all duration-300 hover:shadow-lg hover:scale-105 min-h-[56px] touch-manipulation tracking-wide shadow-2xl hover:shadow-purple-500/25"
        >
          Modernizar Meu Prédio
        </button>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;