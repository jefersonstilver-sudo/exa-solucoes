import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCTA from '../base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const HeroSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="dark" className="min-h-screen flex items-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-exa-purple via-exa-purple/80 to-exa-black opacity-90" />
      
      {/* Animated circles */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-exa-blue/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-exa-yellow/10 rounded-full blur-3xl animate-pulse-soft" />

      <div 
        ref={ref}
        className={`relative z-10 w-full grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Left side - Text content */}
        <div className="space-y-8">
          <h1 className="font-montserrat font-extrabold text-5xl lg:text-7xl text-white leading-tight">
            Publicidade que <span className="text-exa-yellow">convive</span>.
          </h1>
          
          <p className="font-poppins text-xl lg:text-2xl text-gray-200 leading-relaxed max-w-2xl">
            A EXA conecta marcas aos instantes reais da vida urbana — atenção genuína, presença diária e resultados duradouros.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <ExaCTA variant="primary" size="lg" to="/loja">
              Anuncie com a EXA
            </ExaCTA>
            <ExaCTA variant="outline" size="lg" onClick={() => {
              document.getElementById('solucoes')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Conheça Nossas Soluções ↓
            </ExaCTA>
          </div>
        </div>

        {/* Right side - Visual element */}
        <div className="relative group">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-4 lg:p-6 rounded-3xl shadow-2xl border border-gray-700 max-w-[400px] mx-auto hover:scale-105 transition-transform duration-300">
            <div className="bg-black rounded-2xl overflow-hidden shadow-inner aspect-[9/16]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="https://indexa.net.br/wp-content/uploads/2025/01/indexa_exa.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default HeroSection;
