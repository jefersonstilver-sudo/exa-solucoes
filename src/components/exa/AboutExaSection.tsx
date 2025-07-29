import React from 'react';

const AboutExaSection: React.FC = () => {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 sm:mb-12 lg:mb-16 leading-tight">
          Acabou o Marketing Genérico
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-700 max-w-6xl mx-auto leading-relaxed">
          Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
        </p>
      </div>
    </section>
  );
};

export default AboutExaSection;