
import React from 'react';
import { Coffee } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-[75vh] md:min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Background Image - Dynamic Social Networks */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=2339&q=80')] bg-cover bg-center opacity-20"></div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-orange-500/20 to-pink-600/30"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6 py-4 md:py-0 pt-8 md:pt-0 max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-4 md:mb-6">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTM4MTQ3OTksImV4cCI6OTYzNjE4MTQ3OTl9.ERz9rbEWAs_6Ep6BXI5ErN9ixotyUMb3szh2klNK4Us"
            alt="LINKAÊ - Social Media que Inspira"
            className="w-32 sm:w-40 md:w-64 lg:w-80 h-auto mb-3 md:mb-4 animate-fade-in hover:scale-125 transition-all duration-500 drop-shadow-2xl cursor-pointer group"
            style={{ filter: 'drop-shadow(0 0 30px rgba(255, 138, 128, 0.6))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 40px rgba(245, 124, 0, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 30px rgba(255, 138, 128, 0.6))';
            }}
          />
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 mt-4 md:mt-6">
            Conecte Sua Marca com Estratégias que Inspiram
          </h1>
        </div>
        
        <p className="text-base md:text-lg mb-4 md:mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
          Linkae by Indexa transforma desafios digitais em oportunidades, criando posts que conectam emocionalmente e impulsionam crescimento.
        </p>
        
        <button
          onClick={onScrollToForm}
          className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold px-8 py-4 rounded-full text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 flex items-center mx-auto space-x-2 hover:from-orange-500 hover:to-pink-500"
        >
          <Coffee className="w-5 h-5" />
          <span>Agende Sua Reunião Gratuita</span>
        </button>
      </div>
    </section>
  );
};

export default LinkaeHero;
