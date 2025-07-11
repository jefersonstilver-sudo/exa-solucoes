import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30"
      >
        <source src="/assets/exa-hero-video.mp4" type="video/mp4" />
      </video>
      
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold leading-tight mb-8">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            EXA
          </span>
        </h1>
        
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Publicidade Inteligente
        </h2>
        
        <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto opacity-90">
          Painéis digitais com tecnologia avançada que tornam sua publicidade mais eficiente, mensurável e impactante.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105">
            Conhecer EXA
          </button>
          <button className="border-2 border-white text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:bg-white hover:text-purple-900">
            Ver Localização
          </button>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
      <div className="absolute bottom-32 right-10 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-20 w-12 h-12 bg-cyan-400/30 rounded-full animate-ping"></div>
    </section>
  );
};

export default ExaHeroSection;