
import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-br from-linkae-dark-blue to-linkae-royal-blue overflow-hidden">
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
        <div className="flex flex-col items-center mb-6">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTExZDAwOS1hZDAwLTRlZWItYTI3Yi1kYTRlYWEwYzJhZmQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTIxOTY5MzUsImV4cCI6MTc4MzczMjkzNX0.V2OuLQG3PfTnUvmUYMohr8ywxyFWGGQ9UOhqX8mt0G0"
            alt="LINKAÊ - Social Media que Converte"
            className="w-64 md:w-80 lg:w-96 h-auto mb-4 animate-fade-in hover:scale-125 transition-all duration-500 drop-shadow-2xl cursor-pointer group"
            style={{ filter: 'drop-shadow(0 0 30px rgba(77, 166, 255, 0.4))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 40px rgba(91, 192, 235, 0.6))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 30px rgba(77, 166, 255, 0.4))';
            }}
          />
          <h2 className="text-2xl md:text-4xl font-normal text-white/90 mb-3">
            Social Media que converte
          </h2>
        </div>
        
        <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
          Descobra como o método T.A.C.C.O.H. pode elevar sua presença digital e gerar resultados reais que impactam seu faturamento.
        </p>
        
        <button
          onClick={onScrollToForm}
          className="bg-gradient-to-r from-linkae-cyan-light to-linkae-bright-blue text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center mx-auto space-x-2 hover:from-linkae-bright-blue hover:to-linkae-cyan-light"
        >
          <Coffee className="w-5 h-5" />
          <span>Descobrir o T.A.C.C.O.H.</span>
        </button>
      </div>
    </section>
  );
};

export default LinkaeHero;
