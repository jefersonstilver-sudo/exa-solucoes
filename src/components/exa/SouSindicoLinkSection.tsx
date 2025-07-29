import React from 'react';
import { useNavigate } from 'react-router-dom';

const SouSindicoLinkSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSindicoClick = () => {
    navigate('/sou-sindico');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-purple-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-lg sm:text-xl md:text-2xl text-purple-100 mb-8">
          Se você é síndico, veja como modernizar seu prédio
        </p>
        
        <button
          onClick={handleSindicoClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
        >
          Modernizar Meu Prédio
        </button>
      </div>
    </section>
  );
};

export default SouSindicoLinkSection;