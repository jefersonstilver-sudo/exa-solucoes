import React from 'react';

const ExaAdvantagesSection: React.FC = () => {
  return (
    <section className="h-[60vh] bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8">
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center transition-all duration-300 hover:bg-white/15">
            <h3 className="text-xl font-bold text-white mb-4">Impacto Imediato</h3>
            <p className="text-purple-100 text-lg">
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center transition-all duration-300 hover:bg-white/15">
            <h3 className="text-xl font-bold text-white mb-4">Segmentação Inteligente</h3>
            <p className="text-purple-100 text-lg">
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;