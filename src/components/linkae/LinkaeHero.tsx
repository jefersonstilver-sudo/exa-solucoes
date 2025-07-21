
import React from 'react';
import { Coffee, Instagram, Facebook, Linkedin, Twitter, Youtube, Share2, Heart, MessageCircle, Send, Users, TrendingUp } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue">
      {/* Animated Network Background */}
      <div className="absolute inset-0 z-0">
        {/* Floating Social Icons */}
        <div className="absolute top-20 left-20 text-linkae-pink/30 animate-network-float">
          <Instagram className="w-8 h-8" />
        </div>
        <div className="absolute top-32 right-32 text-linkae-orange/30 animate-network-float" style={{animationDelay: '1s'}}>
          <Facebook className="w-10 h-10" />
        </div>
        <div className="absolute bottom-40 left-40 text-linkae-pink/30 animate-network-float" style={{animationDelay: '2s'}}>
          <Linkedin className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-20 text-linkae-orange/30 animate-network-float" style={{animationDelay: '3s'}}>
          <Twitter className="w-8 h-8" />
        </div>
        <div className="absolute bottom-20 right-20 text-linkae-pink/30 animate-network-float" style={{animationDelay: '4s'}}>
          <Youtube className="w-10 h-10" />
        </div>
        <div className="absolute top-60 left-60 text-linkae-orange/30 animate-network-float" style={{animationDelay: '5s'}}>
          <Share2 className="w-8 h-8" />
        </div>
        
        {/* Engagement Icons */}
        <div className="absolute top-80 right-60 text-linkae-pink/20 animate-float">
          <Heart className="w-6 h-6" />
        </div>
        <div className="absolute bottom-60 left-20 text-linkae-orange/20 animate-float" style={{animationDelay: '2s'}}>
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="absolute top-96 right-40 text-linkae-pink/20 animate-float" style={{animationDelay: '3s'}}>
          <Send className="w-6 h-6" />
        </div>
        <div className="absolute bottom-32 left-60 text-linkae-orange/20 animate-float" style={{animationDelay: '4s'}}>
          <Users className="w-6 h-6" />
        </div>
        <div className="absolute top-20 left-80 text-linkae-pink/20 animate-float" style={{animationDelay: '1s'}}>
          <TrendingUp className="w-6 h-6" />
        </div>

        {/* Network Connection Lines */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF8A80" />
                <stop offset="50%" stopColor="#F57C00" />
                <stop offset="100%" stopColor="#4da6ff" />
              </linearGradient>
            </defs>
            <path d="M10,20 Q50,10 90,30" stroke="url(#connectionGradient)" strokeWidth="0.5" fill="none" opacity="0.6" />
            <path d="M20,80 Q60,60 80,90" stroke="url(#connectionGradient)" strokeWidth="0.5" fill="none" opacity="0.4" />
            <path d="M5,50 Q30,40 55,70" stroke="url(#connectionGradient)" strokeWidth="0.5" fill="none" opacity="0.5" />
            <path d="M70,20 Q80,50 95,80" stroke="url(#connectionGradient)" strokeWidth="0.5" fill="none" opacity="0.3" />
          </svg>
        </div>

        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-linkae-pink to-linkae-orange rounded-full animate-particle-drift opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${8 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-linkae-dark-blue/40 via-transparent to-linkae-royal-blue/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTExZDAwOS1hZDAwLTRlZWItYTI3Yi1kYTRlYWEwYzJhZmQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTIxOTY5MzUsImV4cCI6MTc4MzczMjkzNX0.V2OuLQG3PfTnUvmUYMohr8ywxyFWGGQ9UOhqX8mt0G0"
            alt="LINKAÊ by Indexa"
            className="w-72 md:w-96 lg:w-[480px] h-auto mb-6 animate-fade-in hover:scale-105 transition-all duration-500 drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px rgba(255, 138, 128, 0.3))' }}
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-slide-in">
          <span className="bg-gradient-to-r from-white via-linkae-pink to-linkae-orange bg-clip-text text-transparent">
            Conecte Sua Marca com
          </span>
          <br />
          <span className="bg-gradient-to-r from-linkae-orange via-linkae-pink to-white bg-clip-text text-transparent">
            Estratégias que Inspiram
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-10 max-w-5xl mx-auto opacity-90 leading-relaxed animate-fade-in" style={{animationDelay: '0.5s'}}>
          <span className="text-white">Linkae by Indexa</span> <span className="text-linkae-pink font-medium">transforma desafios digitais em oportunidades</span>, 
          criando posts que <span className="text-linkae-orange font-medium">conectam emocionalmente</span> e <span className="text-linkae-pink font-medium">impulsionam crescimento</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in" style={{animationDelay: '1s'}}>
          <button
            onClick={onScrollToForm}
            className="group relative bg-gradient-to-r from-linkae-orange to-linkae-pink text-white font-bold px-10 py-5 rounded-full text-lg transition-all duration-300 hover:scale-105 hover:shadow-glow-orange flex items-center space-x-3 animate-glow-pulse"
          >
            <Coffee className="w-6 h-6 group-hover:animate-bounce" />
            <span>Transformar Minha Presença Digital</span>
          </button>
          
          <div className="flex items-center space-x-4 text-white/80 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-linkae-pink rounded-full animate-pulse"></div>
              <span>Estratégias Personalizadas</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-linkae-orange rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>Resultados Comprovados</span>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/70 text-sm animate-fade-in" style={{animationDelay: '1.5s'}}>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-linkae-pink" />
            <span>+500 Marcas Conectadas</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-linkae-orange" />
            <span>Crescimento Médio de 300%</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-linkae-pink" />
            <span>Engajamento Autêntico</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeHero;
