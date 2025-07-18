
import React from 'react';
import { Sparkles } from 'lucide-react';

interface LinkaeHeroProps {
  onScrollToForm: () => void;
}

const LinkaeHero: React.FC<LinkaeHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Dynamic Social Media Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat filter blur-sm opacity-40"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1611926653458-09294b3142bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
          }}
        />
        {/* Gradient Overlay com acentos coloridos */}
        <div className="absolute inset-0 bg-gradient-to-br from-linkae-dark-blue via-linkae-royal-blue to-linkae-bright-blue opacity-85"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-linkae-accent-pink/20 via-transparent to-linkae-accent-orange/20 animate-gradient-shift"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <img 
            src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/logo-linkae-branco.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8wNTExZDAwOS1hZDAwLTRlZWItYTI3Yi1kYTRlYWEwYzJhZmQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL2xvZ28tbGlua2FlLWJyYW5jby5wbmciLCJpYXQiOjE3NTIxOTY5MzUsImV4cCI6MTc4MzczMjkzNX0.V2OuLQG3PfTnUvmUYMohr8ywxyFWGGQ9UOhqX8mt0G0"
            alt="LINKAÊ - Estratégias que Inspiram"
            className="w-80 md:w-96 lg:w-[28rem] h-auto mb-8 animate-linkae-float drop-shadow-2xl cursor-pointer"
            style={{ filter: 'drop-shadow(0 0 40px rgba(255, 138, 128, 0.6))' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 50px rgba(245, 124, 0, 0.8))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(0 0 40px rgba(255, 138, 128, 0.6))';
            }}
          />
          
          {/* Novo Slogan Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-linkae-accent-pink to-linkae-accent-orange bg-clip-text text-transparent animate-gradient-shift">
              Conecte Sua Marca
            </span>
            <br />
            <span className="text-white/95">
              com Estratégias que Inspiram
            </span>
          </h1>
        </div>
        
        {/* Novo Subtítulo Expandido */}
        <div className="max-w-5xl mx-auto mb-12">
          <p className="text-xl md:text-2xl lg:text-3xl mb-6 text-white/95 font-medium leading-relaxed">
            <strong className="text-linkae-accent-pink">Linkae by Indexa</strong> transforma desafios digitais em oportunidades
          </p>
          <p className="text-lg md:text-xl text-white/85 leading-relaxed">
            Criamos <span className="text-linkae-accent-orange font-semibold">posts que conectam emocionalmente</span> e <span className="text-linkae-accent-pink font-semibold">impulsionam crescimento</span> através de marketing estratégico, planejamento inteligente e o método exclusivo <strong>T.A.C.C.O.H.</strong>
          </p>
        </div>
        
        {/* CTA com Acentos Coloridos */}
        <button
          onClick={onScrollToForm}
          className="group relative bg-gradient-to-r from-linkae-accent-pink to-linkae-accent-orange text-white font-bold px-10 py-5 rounded-full text-xl transition-all duration-500 hover:shadow-linkae-glow hover:scale-110 animate-accent-pulse"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Descobrir Estratégias Personalizadas</span>
          </div>
          
          {/* Gradient Border Animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-linkae-accent-orange to-linkae-accent-pink opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"></div>
        </button>
        
        {/* Indicador de Especialidade */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm md:text-base">
          <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            Marketing Digital
          </span>
          <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            Social Media
          </span>
          <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            Estratégia & Planejamento
          </span>
          <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            Método T.A.C.C.O.H.
          </span>
        </div>
      </div>
    </section>
  );
};

export default LinkaeHero;
