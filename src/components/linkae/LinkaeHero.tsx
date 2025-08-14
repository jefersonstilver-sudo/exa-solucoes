
import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=2339&q=80')] bg-cover bg-center opacity-30"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_65%_20%,hsl(var(--linkae-accent))_0%,transparent_50%)] animate-pulse-soft"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_35%_80%,hsl(var(--linkae-cyan))_0%,transparent_50%)] animate-float"></div>
      
      {/* Dynamic overlay with glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/25 to-cyan-500/20 backdrop-blur-[1px]"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 py-4 md:py-0 pt-8 md:pt-0 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTM4MTQ3OTksImV4cCI6OTYzNjE4MTQ3OTl9.ERz9rbEWAs_6Ep6BXI5ErN9ixotyUMb3szh2klNK4Us"
            alt="LINKAÊ - Social Media que Inspira"
            className="w-36 sm:w-44 md:w-72 lg:w-96 h-auto mb-4 md:mb-6 animate-linkae-float hover:animate-linkae-zoom transition-all duration-700 drop-shadow-2xl cursor-pointer glow-linkae"
            style={{ filter: 'drop-shadow(0 0 40px rgba(77, 166, 255, 0.8)) drop-shadow(0 0 20px rgba(91, 192, 235, 0.6))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 60px rgba(245, 124, 0, 1)) drop-shadow(0 0 30px rgba(255, 138, 128, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 40px rgba(77, 166, 255, 0.8)) drop-shadow(0 0 20px rgba(91, 192, 235, 0.6))';
            }}
          />
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 mt-6 md:mt-8 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-fade-in font-orbitron tracking-wider">
            Conecte Sua Marca com Estratégias que Inspiram
          </h1>
        </div>
        
        <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-10 max-w-5xl mx-auto leading-relaxed text-slate-200 font-exo-2 animate-slide-in">
          Linkae by Indexa transforma desafios digitais em oportunidades, criando posts que conectam emocionalmente e impulsionam crescimento.
        </p>
        
        <button
          onClick={onScrollToForm}
          className="bg-gradient-to-r from-linkae-accent via-linkae-cyan to-purple-500 text-white font-bold px-10 py-5 rounded-full text-xl transition-all duration-500 hover:shadow-2xl hover:scale-110 flex items-center mx-auto space-x-3 hover:from-purple-500 hover:to-linkae-accent animate-linkae-glow font-montserrat tracking-wide backdrop-blur-sm border border-white/20"
        >
          <Coffee className="w-6 h-6" />
          <span>Agende Sua Reunião Gratuita</span>
        </button>
      </div>
    </section>
  );
};

export default LinkaeHero;
