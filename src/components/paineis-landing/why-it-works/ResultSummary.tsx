
import React from 'react';

const ResultSummary: React.FC = () => {
  return (
    <div className="text-center mt-12 sm:mt-16">
      <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-indexa-mint/30 max-w-3xl mx-auto">
        <p className="text-xl sm:text-2xl font-bold text-white mb-2">
          <span className="text-indexa-mint">Resultado:</span> 95% de taxa de atenção
        </p>
        <p className="text-white/80 text-base sm:text-lg">
          Mais de <span className="text-indexa-mint font-semibold">502 exibições por dia</span> por painel — muito superior a qualquer outra mídia digital
        </p>
      </div>
    </div>
  );
};

export default ResultSummary;
