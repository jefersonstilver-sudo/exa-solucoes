import React from 'react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="min-h-[60vh] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Agende uma Reunião Gratuita
        </h2>
        <p className="text-lg sm:text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
          Descubra como a EXA pode revolucionar sua estratégia de marketing para empresários de todos os portes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto mb-8">
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
            Agendar Reunião Gratuita
          </button>
          <button className="border-2 border-purple-400/60 text-purple-200 font-semibold px-8 py-4 rounded-lg text-lg transition-all duration-300 hover:bg-purple-400/10">
            Ver Localizações Disponíveis
          </button>
        </div>

        <div className="text-center">
          <p className="text-purple-200 text-sm">
            Sem taxas ocultas • Analytics inclusos • Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;