import React from 'react';

const ExaAdvantagesSection: React.FC = () => {
  return (
    <section className="bg-white flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-6 sm:mb-8 leading-tight tracking-wide drop-shadow-2xl text-center">
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-purple-500/25">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-exo-2 font-bold text-white mb-3 sm:mb-4 tracking-wide">Impacto Imediato</h3>
            <p className="font-exo-2 font-light text-white/90 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed tracking-wide">
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:shadow-indigo-500/25">
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-exo-2 font-bold text-white mb-3 sm:mb-4 tracking-wide">Segmentação Inteligente</h3>
            <p className="font-exo-2 font-light text-white/90 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed tracking-wide">
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;