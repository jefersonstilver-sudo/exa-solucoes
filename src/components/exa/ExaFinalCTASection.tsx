import React from 'react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="min-h-screen bg-white flex items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 shadow-lg">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-orbitron font-black text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-600 bg-clip-text mb-8 sm:mb-12 lg:mb-16 leading-tight tracking-wide drop-shadow-2xl text-center">
          Agende uma Reunião Gratuita
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-exo-2 font-light text-slate-700 mb-12 sm:mb-16 lg:mb-20 max-w-5xl mx-auto leading-relaxed tracking-wide text-center">
          Descubra como a EXA pode revolucionar sua estratégia de marketing para empresários de todos os portes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-exo-2 font-bold px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto min-h-[64px] touch-manipulation tracking-wide shadow-2xl hover:shadow-purple-500/25">
            Agendar Reunião Gratuita
          </button>
          <button className="border-2 border-purple-400 text-purple-600 font-exo-2 font-semibold px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-sm sm:text-base md:text-lg transition-all duration-300 hover:bg-purple-50 hover:shadow-lg w-full sm:w-auto min-h-[64px] touch-manipulation tracking-wide">
            Ver Localizações Disponíveis
          </button>
        </div>

        <div className="text-center">
          <p className="font-exo-2 font-light text-gray-600 text-xs sm:text-sm md:text-base tracking-wide text-center">
            Sem taxas ocultas • Analytics inclusos • Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;