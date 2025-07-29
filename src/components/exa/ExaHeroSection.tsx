import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Video - Painéis EXA em ação */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover filter blur-sm opacity-30"
      >
        <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc1MzgyNDIyOSwiZXhwIjo5NjM2MTgyNDIyOX0._w4I2p-iPfcVC0MFevGRW5jcJXF5RTzAuVk8KB-MZeU" type="video/mp4" />
      </video>
      
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            EXA
          </span>
        </h1>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8">
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
          <span className="block mb-4">
            <strong>Imagine seu anúncio alcançando clientes reais na fronteira.</strong>
          </span>
          <span className="block">Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block text-purple-300 mt-2">segunda-quarta para serviços, quinta-domingo para lazer</span>
        </p>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 mb-8 text-sm sm:text-base">
          <p className="text-purple-200">
            Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md sm:max-w-none mx-auto">
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-lg text-base lg:text-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
            Conhecer EXA
          </button>
          <button className="border-2 border-white/60 text-white font-semibold px-8 py-4 rounded-lg text-base lg:text-lg transition-all duration-300 hover:bg-white/10">
            Ver Localização
          </button>
        </div>
      </div>
    </section>
  );
};

export default ExaHeroSection;