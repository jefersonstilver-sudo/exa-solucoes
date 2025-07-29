import React from 'react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-purple-100 flex items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-8 sm:mb-12 lg:mb-16 leading-tight">
          Agende uma Reunião Gratuita
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-700 mb-12 sm:mb-16 lg:mb-20 max-w-5xl mx-auto leading-relaxed">
          Descubra como a EXA pode revolucionar sua estratégia de marketing para empresários de todos os portes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-lg sm:text-xl lg:text-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto min-h-[64px] touch-manipulation">
            Agendar Reunião Gratuita
          </button>
          <button className="border-2 border-purple-500 text-purple-600 font-semibold px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-lg sm:text-xl lg:text-2xl transition-all duration-300 hover:bg-purple-50 w-full sm:w-auto min-h-[64px] touch-manipulation">
            Ver Localizações Disponíveis
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-base sm:text-lg md:text-xl">
            Sem taxas ocultas • Analytics inclusos • Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;