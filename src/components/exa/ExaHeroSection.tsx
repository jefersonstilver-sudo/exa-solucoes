import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 overflow-hidden">
      <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl mx-auto gap-8 sm:gap-10 lg:gap-16 py-8 sm:py-12 lg:py-16">
        
        {/* Conteúdo de Texto */}
        <div className="flex-1 text-center lg:text-left text-white w-full lg:max-w-2xl order-2 lg:order-1">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 sm:mb-8 lg:mb-10">
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            EXA
          </span>
        </h1>
        
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight">
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl mb-6 sm:mb-8 lg:mb-10 opacity-90 leading-relaxed max-w-4xl">
          <span className="block mb-4 sm:mb-6">
            <strong>Imagine seu anúncio alcançando clientes reais na fronteira.</strong>
          </span>
          <span className="block mb-2 sm:mb-3">Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block text-purple-300">segunda-quarta para serviços, quinta-domingo para lazer</span>
        </p>
        
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-8 sm:mb-10 text-sm sm:text-base md:text-lg">
          <p className="text-purple-200">
            Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start w-full">
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg lg:text-xl transition-all duration-300 hover:shadow-lg hover:scale-105 w-full sm:w-auto min-h-[56px] touch-manipulation">
            Conhecer EXA
          </button>
          <button className="border-2 border-white/60 text-white font-semibold px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-base sm:text-lg lg:text-xl transition-all duration-300 hover:bg-white/10 w-full sm:w-auto min-h-[56px] touch-manipulation">
            Ver Localização
          </button>
        </div>
        </div>
        
        {/* Vídeo dos Painéis EXA */}
        <div className="flex-1 flex justify-center lg:justify-end w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl order-1 lg:order-2">
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            preload="metadata"
            className="w-full h-auto rounded-lg shadow-2xl min-h-[400px] max-h-[70vh] sm:max-h-[80vh] lg:max-h-[90vh] object-cover"
          >
            <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20painel%20comercial/WhatsApp%20Video%202025-05-21%20at%2013.24.20.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcGFpbmVsIGNvbWVyY2lhbC9XaGF0c0FwcCBWaWRlbyAyMDI1LTA1LTIxIGF0IDEzLjI0LjIwLm1wNCIsImlhdCI6MTc1MzgyNDIyOSwiZXhwIjo5NjM2MTgyNDIyOX0._w4I2p-iPfcVC0MFevGRW5jcJXF5RTzAuVk8KB-MZeU" type="video/mp4" />
          </video>
        </div>
        
      </div>
    </section>
  );
};

export default ExaHeroSection;