import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ background: 'var(--gradient-linkae-hero)' }}>
      {/* Background Video */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30"
        poster="/assets/video-thumbnail.jpg"
      >
        <source src="/assets/hero-video.mp4" type="video/mp4" />
      </video>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTExZDAwOS1hZDAwLTRlZWItYTI3Yi1kYTRlYWEwYzJhZmQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTIxOTY5MzUsImV4cCI6MTc4MzczMjkzNX0.V2OuLQG3PfTnUvmUYMohr8ywxyFWGGQ9UOhqX8mt0G0"
            alt="LINKAÊ - Social Media que Converte"
            className="w-64 md:w-80 lg:w-96 h-auto mb-6 animate-fade-in hover:scale-105 transition-all duration-300 drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 30px hsl(var(--linkae-pink) / 0.4))' }}
          />
          <h2 className="text-2xl md:text-4xl font-normal text-white/90">
            Social Media que converte
          </h2>
        </div>
        
        <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto opacity-90">
          Criamos conteúdo estratégico para redes sociais que gera engajamento real e resultados mensuráveis para sua marca.
        </p>
        
        <button
          onClick={onScrollToForm}
          className="btn-linkae-primary text-lg flex items-center mx-auto space-x-2"
        >
          <Coffee className="w-5 h-5" />
          <span>Conversar sobre Social Media</span>
        </button>
      </div>
    </section>
  );
};

export default LinkaeHero;