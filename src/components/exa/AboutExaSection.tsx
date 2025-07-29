import React from 'react';

const AboutExaSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-6 sm:mb-8 lg:mb-10 leading-tight tracking-wide drop-shadow-2xl">
          Acabou o Marketing Genérico
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-exo-2 font-light text-white/90 max-w-4xl mx-auto leading-relaxed tracking-wide">
          Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
        </p>
      </div>
    </section>
  );
};

export default AboutExaSection;