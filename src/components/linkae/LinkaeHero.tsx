
import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue overflow-hidden">
      {/* Background Image - Dynamic Social Media */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1920&h=1080&fit=crop&auto=format')`
        }}
      />
      
      {/* Gradient Overlay with Accent Colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-linkae-dark-blue/90 via-linkae-royal-blue/80 to-linkae-bright-blue/70" />
      
      {/* Accent Elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-linkae-accent-pink/20 rounded-full animate-accent-pulse hidden md:block" />
      <div className="absolute bottom-32 right-16 w-12 h-12 bg-linkae-accent-orange/25 rounded-full animate-accent-pulse animation-delay-1000 hidden md:block" />
      <div className="absolute top-1/3 right-8 w-8 h-8 bg-linkae-accent-pink/30 rounded-full animate-float hidden lg:block" />
      <div className="absolute bottom-1/4 left-20 w-10 h-10 bg-linkae-accent-orange/20 rounded-full animate-linkae-float hidden lg:block" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          {/* Logo with enhanced effects */}
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTExZDAwOS1hZDAwLTRlZWItYTI3Yi1kYTRlYWEwYzJhZmQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTIxOTY5MzUsImV4cCI6MTc4MzczMjkzNX0.V2OuLQG3PfTnUvmUYMohr8ywxyFWGGQ9UOhqX8mt0G0"
            alt="LINKAÊ by Indexa"
            className="w-64 md:w-80 lg:w-96 h-auto mb-8 animate-fade-in hover:scale-110 transition-all duration-700 drop-shadow-2xl cursor-pointer"
            style={{ 
              filter: 'drop-shadow(0 0 40px rgba(255, 138, 128, 0.3)) drop-shadow(0 0 20px rgba(77, 166, 255, 0.4))' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 50px rgba(255, 138, 128, 0.5)) drop-shadow(0 0 30px rgba(245, 124, 0, 0.4))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 40px rgba(255, 138, 128, 0.3)) drop-shadow(0 0 20px rgba(77, 166, 255, 0.4))';
            }}
          />
          
          {/* Brand Identifier */}
          <div className="text-sm md:text-base text-linkae-cyan-light/80 mb-4 font-medium tracking-wide">
            Linkae by Indexa
          </div>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-linkae-cyan-light to-white bg-clip-text text-transparent animate-gradient-shift bg-300% bg-size-200">
            Conecte Sua Marca
          </span>
          <br />
          <span className="text-white/95">
            com{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange bg-clip-text text-transparent font-extrabold">
                Estratégias
              </span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange rounded-full opacity-60 animate-gradient-shift bg-size-200" />
            </span>
            {' '}que Inspiram
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto opacity-90 leading-relaxed text-white/90">
          <span className="font-medium text-linkae-cyan-light">Linkae by Indexa</span> transforma desafios digitais em oportunidades, 
          criando posts que conectam emocionalmente e impulsionam crescimento.
        </p>
        
        {/* CTA Button with Accent Colors */}
        <button
          onClick={onScrollToForm}
          className="group relative bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange text-white font-bold px-10 py-5 rounded-full text-lg transition-all duration-500 hover:shadow-2xl hover:scale-105 flex items-center mx-auto space-x-3 overflow-hidden"
        >
          {/* Button Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-linkae-accent-orange to-linkae-accent-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Button Content */}
          <div className="relative z-10 flex items-center space-x-3">
            <Coffee className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Descobrir o T.A.C.C.O.H.</span>
          </div>
          
          {/* Button Glow Effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
        </button>
        
        {/* Secondary Info */}
        <p className="text-sm md:text-base text-white/70 mt-6 font-light">
          Metodologia exclusiva para social media que converte
        </p>
      </div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default LinkaeHero;
