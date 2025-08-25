
import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-[80vh] md:min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-linkae-primary/20 via-linkae-secondary/15 to-linkae-accent/25 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-linkae-cyan/10 rounded-full blur-3xl animate-linkae-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-linkae-accent/15 rounded-full blur-3xl animate-linkae-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linkae-primary/5 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      {/* Dynamic Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
      
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-linkae-primary/12 via-transparent to-linkae-accent/8"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 py-16 md:py-20 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-8 md:mb-10">
          <div className="mb-8 md:mb-12 mt-8 md:mt-12">
            <img 
              src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTM4MTQ3OTksImV4cCI6OTYzNjE4MTQ3OTl9.ERz9rbEWAs_6Ep6BXI5ErN9ixotyUMb3szh2klNK4Us"
              alt="LINKAÊ - Social Media que Inspira"
              className="w-40 sm:w-48 md:w-72 lg:w-96 h-auto animate-fade-in hover:scale-110 transition-all duration-700 drop-shadow-2xl cursor-pointer"
            />
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 animate-fade-in leading-tight">
            Conecte Sua Marca com 
            <span className="block bg-gradient-to-r from-linkae-cyan to-linkae-secondary bg-clip-text text-transparent animate-linkae-float">
              Estratégias que Inspiram
            </span>
          </h1>
        </div>
        
        <p className="text-lg md:text-xl mb-6 md:mb-10 max-w-4xl mx-auto opacity-90 leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Linkae by Indexa transforma desafios digitais em oportunidades, criando posts que conectam emocionalmente e impulsionam crescimento.
        </p>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={onScrollToForm}
            className="group bg-gradient-to-r from-linkae-secondary to-linkae-accent text-white font-bold px-10 py-5 rounded-2xl text-lg md:text-xl transition-all duration-500 hover:shadow-[0_0_40px_hsl(var(--linkae-accent)/0.5)] hover:scale-110 flex items-center mx-auto space-x-3 hover:from-linkae-accent hover:to-linkae-secondary"
          >
            <Coffee className="w-6 h-6 group-hover:animate-bounce" />
            <span>Agende Sua Reunião Gratuita</span>
          </button>
          
          <p className="text-sm opacity-70 mt-4 animate-pulse">
            ✨ Sem compromisso • Conversa de 30 minutos • 100% focado no seu negócio
          </p>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-1/4 left-1/4 animate-linkae-float opacity-30">
        <div className="w-3 h-3 bg-linkae-cyan rounded-full shadow-lg"></div>
      </div>
      <div className="absolute top-3/4 right-1/4 animate-linkae-float opacity-30" style={{ animationDelay: '2s' }}>
        <div className="w-2 h-2 bg-linkae-white rounded-full shadow-lg"></div>
      </div>
      <div className="absolute top-1/2 right-1/6 animate-linkae-float opacity-30" style={{ animationDelay: '1.5s' }}>
        <div className="w-4 h-4 bg-linkae-accent rounded-full shadow-lg"></div>
      </div>
    </section>
  );
};

export default LinkaeHero;
