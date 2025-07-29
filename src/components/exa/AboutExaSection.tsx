import React from 'react';
import ExaQRCodeWithLogo from './ExaQRCodeWithLogo';

const AboutExaSection: React.FC = () => {
  return (
    <section id="sobre-exa" className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
          {/* QR Code Section */}
          <div className="flex-shrink-0 order-2 lg:order-1">
            <ExaQRCodeWithLogo 
              size={220}
              className="mx-auto lg:mx-0"
            />
          </div>
          
          {/* Content Section */}
          <div className="flex-1 text-center order-1 lg:order-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-purple-400 bg-clip-text mb-4 sm:mb-6 lg:mb-8 leading-tight tracking-wide drop-shadow-2xl">
              Acabou o Marketing Genérico
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg font-exo-2 font-light text-white/90 leading-relaxed tracking-wide">
              Os painéis EXA permitem anúncios segmentados em prédios, com mensuração de QR codes escaneados e flexibilidade para múltiplos vídeos por semana, resolvendo dores de marketing genérico e impulsionando conexões que transformam visibilidade em vendas para todos os tamanhos de negócios.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutExaSection;