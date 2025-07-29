import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-12 lg:py-20">
      {/* Background Video - Painéis EXA em ação */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30"
      >
        <source src="/assets/exa-paineis-acao.mp4" type="video/mp4" />
      </video>
      
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 sm:mb-8">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            EXA
          </span>
        </h1>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6">
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-6 sm:mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
          <span className="block mb-2 sm:mb-4">
            <strong>Imagine seu anúncio alcançando clientes reais na fronteira.</strong>
          </span>
          <span className="block sm:inline">Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block sm:inline text-blue-300"> segunda-quarta para serviços</span><span className="hidden sm:inline">, </span>
          <span className="block sm:inline text-purple-300"> quinta-domingo para lazer</span>.
        </p>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 sm:p-4 mb-6 sm:mb-8 text-xs sm:text-sm md:text-base">
          <p className="text-cyan-300">
            ✨ Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105">
            Conhecer EXA
          </button>
          <button className="border-2 border-white text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg transition-all duration-300 hover:bg-white hover:text-purple-900">
            Ver Localização
          </button>
        </div>
      </div>
      
      {/* Floating elements - Hidden on mobile for better UX */}
      <div className="hidden sm:block absolute top-20 left-4 lg:left-10 w-12 h-12 lg:w-20 lg:h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
      <div className="hidden sm:block absolute bottom-32 right-4 lg:right-10 w-10 h-10 lg:w-16 lg:h-16 bg-purple-500/20 rounded-full animate-bounce"></div>
      <div className="hidden md:block absolute top-1/3 right-8 lg:right-20 w-8 h-8 lg:w-12 lg:h-12 bg-cyan-400/30 rounded-full animate-ping"></div>
    </section>
  );
};

export default ExaHeroSection;