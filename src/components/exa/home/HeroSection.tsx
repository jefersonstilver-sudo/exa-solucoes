import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCTA from '../base/ExaCTA';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useHomepageVideo } from '@/hooks/useHomepageVideo';
const HeroSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const {
    videoUrl,
    loading
  } = useHomepageVideo();

  // Fallback video URL
  const defaultVideoUrl = 'https://indexa.net.br/wp-content/uploads/2025/01/indexa_exa.mp4';
  const displayVideoUrl = videoUrl || defaultVideoUrl;
  return <ExaSection background="dark" className="min-h-[22vh] md:min-h-[26vh] flex items-center relative overflow-hidden pt-20 md:pt-22 pb-1 md:pb-2">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9C1E1E] via-[#180A0A]/80 to-exa-black opacity-90" />
      
      {/* Animated circles */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-exa-blue/20 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-exa-yellow/10 rounded-full blur-3xl animate-pulse-soft" />

      <div ref={ref} className={`relative z-10 w-full grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Left side - Text content */}
        <div className="space-y-6 md:space-y-6">
          <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl lg:text-6xl text-white leading-tight">
            Publicidade que <span className="text-exa-yellow">convive</span>.
          </h1>
          
          <p className="font-poppins text-base md:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-2xl">
            A EXA conecta marcas aos instantes reais da vida urbana — atenção genuína, presença diária e resultados duradouros.
          </p>

          <div className="hidden sm:flex flex-col sm:flex-row gap-4 pt-2">
            <ExaCTA 
              variant="primary" 
              size="lg" 
              href="https://wa.me/554591415856"
            >
              Falar com Vendedor
            </ExaCTA>
            
          </div>
        </div>

        {/* Right side - Visual element */}
        <div className="relative group mt-6 lg:mt-6">
          <div className="bg-gradient-to-b from-zinc-300 via-zinc-200 to-zinc-100 p-2 md:p-2.5 lg:p-3 rounded-3xl shadow-2xl border border-white/90 max-w-[240px] md:max-w-[280px] mx-auto hover:scale-105 transition-transform duration-300">
            <div className="bg-black rounded-2xl overflow-hidden shadow-inner aspect-[9/16]">
              {!loading && <video autoPlay loop muted playsInline controls className="w-full h-full object-cover" key={displayVideoUrl}>
                  <source src={displayVideoUrl} type="video/mp4" />
                </video>}
              {loading && <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-exa-yellow"></div>
                </div>}
            </div>
          </div>
        </div>
      </div>
    </ExaSection>;
};
export default HeroSection;