
import React from 'react';

const MarketingMission: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-indexa-mint to-indexa-purple rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-indexa-purple to-indexa-mint rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
          <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent">Transformamos ideias</span> em campanhas memoráveis.
        </h2>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Na Indexa, criar uma campanha não é apenas rodar um anúncio. É mergulhar na essência da marca, extrair sua verdade mais profunda e transformá-la em movimento, linguagem e conexão real com seu público.
            </p>
          </div>
          <div className="bg-gradient-to-r from-indexa-mint/20 to-indexa-purple/20 backdrop-blur-sm rounded-2xl p-8 border border-indexa-mint/30">
            <p className="text-2xl text-indexa-mint font-semibold">
              Antes de ligar as câmeras, ligamos o cérebro e o coração.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Ajudamos marcas a se comunicarem de forma poderosa com seus públicos. Começamos entendendo a essência da empresa em reuniões profundas com nossos especialistas. Depois, traduzimos tudo isso em uma campanha estruturada: <strong className="text-indexa-mint">estratégia + branding + linguagem + conteúdo + tráfego + performance.</strong>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingMission;
