import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[80vh] bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      <div className="min-h-[80vh] flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto gap-6 sm:gap-8 lg:gap-12 py-8 lg:py-0">
        
        {/* Conteúdo de Texto */}
        <div className="flex-1 text-center lg:text-left text-white w-full lg:max-w-2xl order-2 lg:order-1">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-4 sm:mb-6 lg:mb-8">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            EXA
          </span>
        </h1>
        
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 lg:mb-8">
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-4 sm:mb-6 lg:mb-8 opacity-90 leading-relaxed">
          <span className="block mb-2 sm:mb-4">
            <strong>Imagine seu anúncio alcançando clientes reais na fronteira.</strong>
          </span>
          <span className="block mb-1 sm:mb-2">Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block text-purple-300">segunda-quarta para serviços, quinta-domingo para lazer</span>
        </p>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 text-xs sm:text-sm md:text-base">
          <p className="text-purple-200">
            Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start w-full">
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base lg:text-lg transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto">
            Conhecer EXA
          </button>
          <button className="border-2 border-white/60 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-sm sm:text-base lg:text-lg transition-all duration-300 hover:bg-white/10 w-full sm:w-auto">
            Ver Localização
          </button>
        </div>
        </div>
        
        {/* Vídeo dos Painéis EXA */}
        <div className="flex-1 flex justify-center lg:justify-end w-full max-w-xs sm:max-w-sm lg:max-w-lg order-1 lg:order-2">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-auto rounded-lg shadow-2xl"
          >
            <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc1MzgyNDIyOSwiZXhwIjo5NjM2MTgyNDIyOX0._w4I2p-iPfcVC0MFevGRW5jcJXF5RTzAuVk8KB-MZeU" type="video/mp4" />
          </video>
        </div>
        
      </div>
    </section>
  );
};

export default ExaHeroSection;