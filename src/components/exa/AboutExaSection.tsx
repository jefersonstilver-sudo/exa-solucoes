import React from 'react';

const AboutExaSection: React.FC = () => {
  return (
    <section className="min-h-[80vh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-0">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 lg:mb-8">
          Acabou o Marketing Genérico
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-purple-100 max-w-5xl mx-auto leading-relaxed px-4">
          Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
        </p>
      </div>
    </section>
  );
};

export default AboutExaSection;