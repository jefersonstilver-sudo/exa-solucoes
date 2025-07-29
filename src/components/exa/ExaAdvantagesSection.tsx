import React from 'react';

const ExaAdvantagesSection: React.FC = () => {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-8 sm:mb-12 leading-tight tracking-wide drop-shadow-sm">
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 max-w-6xl mx-auto">
          <div className="bg-white border border-purple-200 shadow-lg rounded-xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center transition-all duration-300 hover:shadow-xl hover:scale-105">
            <h3 className="font-montserrat text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-purple-700 mb-4 sm:mb-6 lg:mb-8 tracking-wide">Impacto Imediato</h3>
            <p className="font-montserrat text-gray-600 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-normal tracking-wide">
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className="bg-white border border-purple-200 shadow-lg rounded-xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center transition-all duration-300 hover:shadow-xl hover:scale-105">
            <h3 className="font-montserrat text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-purple-700 mb-4 sm:mb-6 lg:mb-8 tracking-wide">Segmentação Inteligente</h3>
            <p className="font-montserrat text-gray-600 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-normal tracking-wide">
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;