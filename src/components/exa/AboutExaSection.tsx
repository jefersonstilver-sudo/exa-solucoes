import React from 'react';

const AboutExaSection: React.FC = () => {
  return (
    <section className="h-[80vh] bg-muted/50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8">
          Acabou o Marketing Genérico
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
        </p>
      </div>
    </section>
  );
};

export default AboutExaSection;