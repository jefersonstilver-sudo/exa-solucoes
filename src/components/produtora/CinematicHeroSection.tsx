import React, { useState, useEffect } from 'react';
import { Play, Calendar, ChevronDown } from 'lucide-react';

const CinematicHeroSection = () => {
  const [textVisible, setTextVisible] = useState(false);

  const heroVideoSrc = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo";

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const scrollToQuote = () => {
    const quoteSection = document.getElementById('quote-section');
    quoteSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCoffee = () => {
    const coffeeSection = document.getElementById('coffee-section');
    coffeeSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNext = () => {
    const nextSection = document.getElementById('super-studio-section');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Vídeo de fundo cinematográfico */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        {/* Overlay cinematográfico com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        {/* Efeito de grain cinematográfico */}
        <div className="absolute inset-0 opacity-10" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="text-center max-w-6xl mx-auto">
          {/* Badge premium */}
          <div className={`inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-6 py-2 rounded-full text-sm font-bold mb-8 transform transition-all duration-1000 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <span className="w-2 h-2 bg-black rounded-full mr-2 animate-pulse"></span>
            ESTÚDIO CINEMATOGRÁFICO PREMIUM
          </div>

          {/* Headline principal cinematográfica */}
          <div className={`transform transition-all duration-1500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
              <span className="block mb-2">SUPER ESTÚDIO</span>
              <span className="block bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2">
                CINEMATOGRÁFICO
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white/90 font-light tracking-wide">
                + Locação Profissional
              </span>
            </h1>
          </div>

          {/* Sub-headline com detalhes técnicos */}
          <div className={`max-w-4xl mx-auto mb-10 transform transition-all duration-1500 delay-300 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <p className="text-xl sm:text-2xl text-white/90 leading-relaxed mb-4">
              Produza vídeos com <span className="text-yellow-400 font-bold">qualidade de cinema</span>
            </p>
            <p className="text-lg text-white/80 leading-relaxed">
              Teleprompter • Chroma Key 360° • Câmeras 6K • Iluminação Profissional • Equipe Especializada
            </p>
          </div>

          {/* CTAs estratégicos */}
          <div className={`flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 transform transition-all duration-1500 delay-500 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <button
              onClick={scrollToQuote}
              className="group bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-5 px-10 rounded-full shadow-2xl hover:shadow-yellow-500/50 transform transition-all duration-500 hover:scale-110 hover:-translate-y-2 min-w-[280px]"
            >
              <span className="flex items-center justify-center space-x-3">
                <Play className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                <span className="text-lg">RESERVAR ESTÚDIO</span>
              </span>
            </button>
            
            <button
              onClick={scrollToCoffee}
              className="group bg-white/10 backdrop-blur-md text-white border-2 border-white/30 font-bold py-5 px-10 rounded-full hover:bg-white/20 hover:border-white/50 transform transition-all duration-500 hover:scale-110 min-w-[280px]"
            >
              <span className="flex items-center justify-center space-x-3">
                <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-lg">AGENDAR CAFÉ</span>
              </span>
            </button>
          </div>

          {/* Indicadores de valor */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12 transform transition-all duration-1500 delay-700 ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="text-yellow-400 font-bold text-lg">R$ 800/hora</div>
              <div className="text-white/80 text-sm">Locação completa</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="text-yellow-400 font-bold text-lg">Qualidade 6K</div>
              <div className="text-white/80 text-sm">Câmeras profissionais</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="text-yellow-400 font-bold text-lg">Chroma 360°</div>
              <div className="text-white/80 text-sm">Cenário infinito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={scrollToNext}
          className="text-white/60 hover:text-white transition-colors duration-300 animate-bounce"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};

export default CinematicHeroSection;