import React from 'react';

const AboutExaSection: React.FC = () => {
  return (
    <section className="h-[80vh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8">
          Acabou o Marketing Genérico
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-purple-100 max-w-5xl mx-auto leading-relaxed">
          Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
        </p>
      </div>
    </section>
  );
};

export default AboutExaSection;