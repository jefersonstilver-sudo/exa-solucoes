import React from 'react';
import { Sparkles, Play, TrendingUp } from 'lucide-react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Advanced Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/90 to-indigo-900/95"></div>
      
      {/* Animated Geometric Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-purple-500/25 to-pink-500/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Background Video with Enhanced Overlay */}
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-15"
      >
        <source src="/assets/exa-paineis-acao.mp4" type="video/mp4" />
      </video>
      
      {/* Overlay Pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/40"></div>
      
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Premium Logo/Title */}
        <div className="mb-8 relative">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-none tracking-tight">
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-shimmer bg-[length:200%_100%]">
                EXA
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 blur-xl rounded-lg animate-glow"></div>
            </span>
          </h1>
          <div className="flex items-center justify-center mt-4 gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-sm sm:text-base font-medium text-cyan-300 tracking-wider uppercase">
              Publicidade do Futuro
            </span>
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" style={{animationDelay: '0.5s'}} />
          </div>
        </div>
        
        {/* Enhanced Subtitle */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 leading-tight">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Publicidade Inteligente que 
          </span>
          <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
            Conecta & Converte
          </span>
        </h2>
        
        {/* Premium Description */}
        <div className="max-w-5xl mx-auto mb-10">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 leading-relaxed font-light">
            <span className="block mb-4 text-white font-semibold">
              🎯 Imagine seu anúncio alcançando clientes reais na fronteira.
            </span>
            <span className="text-gray-200">
              Painéis digitais 4K em prédios estratégicos com programação inteligente:
            </span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-base sm:text-lg md:text-xl">
            <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-6 py-3">
              <span className="text-blue-300">📅 Segunda-Quarta:</span>
              <span className="text-white ml-2 font-medium">Serviços B2B</span>
            </div>
            <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-400/30 rounded-full px-6 py-3">
              <span className="text-purple-300">🎮 Quinta-Domingo:</span>
              <span className="text-white ml-2 font-medium">Lazer & Lifestyle</span>
            </div>
          </div>
        </div>
        
        {/* Success Proof Badge */}
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-400/30 rounded-2xl p-4 sm:p-6 mb-10 max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-emerald-300 font-bold text-lg sm:text-xl">+340% ROI Comprovado</p>
            <p className="text-gray-300 text-sm sm:text-base">Em lanches residenciais com apenas 1-2 prédios</p>
          </div>
        </div>
        
        {/* Premium CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-lg sm:max-w-none mx-auto">
          <button className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg lg:text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transform">
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Play className="w-5 h-5" />
              Conhecer EXA
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
          
          <button className="group relative border-2 border-white/30 backdrop-blur-sm text-white font-bold px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-base sm:text-lg lg:text-xl transition-all duration-500 hover:bg-white hover:text-slate-900 hover:border-white hover:shadow-xl hover:scale-105 transform">
            <span className="flex items-center justify-center gap-3">
              📍 Ver Localizações
            </span>
          </button>
        </div>
      </div>
      
      {/* Enhanced Floating Elements */}
      <div className="hidden lg:block absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full animate-float"></div>
      <div className="hidden lg:block absolute bottom-32 right-10 w-16 h-16 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full animate-bounce"></div>
      <div className="hidden lg:block absolute top-1/3 right-20 w-12 h-12 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full animate-ping"></div>
      <div className="hidden xl:block absolute bottom-1/4 left-1/4 w-8 h-8 bg-gradient-to-r from-emerald-400/30 to-teal-500/30 rounded-full animate-pulse"></div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default ExaHeroSection;