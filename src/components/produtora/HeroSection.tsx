import React, { useState, useEffect } from 'react';

const HeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTextVisible(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const scrollToNext = () => {
    const nextSection = document.getElementById('historia-section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        style={{ filter: 'brightness(0.6)' }}
      >
        <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/videos%20produtora/hero-background.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-full max-w-5xl mx-auto px-8 transition-all duration-1500 ease-out ${
          textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-3xl p-12 lg:p-16 text-center shadow-2xl">
            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
              Eleve Sua História a Alturas Cinematográficas com a 
              <span className="text-transparent bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text"> INDEXA Produtora</span>
            </h1>
            
            <p className="font-montserrat text-lg md:text-xl lg:text-2xl text-white leading-relaxed mb-12 max-w-4xl mx-auto">
              No coração de Foz do Iguaçu, criamos vídeos que capturam a essência do seu negócio, 
              transformando desafios cotidianos como conteúdos sem inspiração em narrativas poderosas que 
              <span className="text-orange-400 font-medium"> conectam emocionalmente e inspiram ação</span>. 
              Nosso estúdio avançado é o toque extra que faz cada produção parecer um blockbuster.
            </p>
            
            <button 
              onClick={() => window.open('#contato', '_self')}
              className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-montserrat font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl animate-pulse"
            >
              <span>Agende uma Reunião de Descoberta</span>
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <button 
          onClick={scrollToNext}
          className="text-white hover:text-orange-400 transition-colors duration-300 animate-bounce"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default HeroSection;