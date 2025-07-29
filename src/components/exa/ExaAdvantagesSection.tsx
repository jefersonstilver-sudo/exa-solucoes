import React from 'react';

const ExaAdvantagesSection: React.FC = () => {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-8 sm:mb-12 leading-tight tracking-wide drop-shadow-2xl">
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 max-w-6xl mx-auto">
          <div className="bg-white border border-purple-200 shadow-lg rounded-xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-purple-500/25">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-exo-2 font-bold text-slate-800 mb-4 sm:mb-6 lg:mb-8 tracking-wide">Impacto Imediato</h3>
            <p className="font-exo-2 font-light text-gray-600 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed tracking-wide">
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className="bg-white border border-purple-200 shadow-lg rounded-xl p-6 sm:p-8 lg:p-10 xl:p-12 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-purple-500/25">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-exo-2 font-bold text-slate-800 mb-4 sm:mb-6 lg:mb-8 tracking-wide">Segmentação Inteligente</h3>
            <p className="font-exo-2 font-light text-gray-600 text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed tracking-wide">
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;