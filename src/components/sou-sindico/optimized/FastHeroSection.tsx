import React, { useRef, useState, useEffect, memo } from 'react';
import { Play, VolumeX, Volume2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FastHeroSectionProps {
  isVisible: boolean;
}

const FastHeroSection: React.FC<FastHeroSectionProps> = memo(({ isVisible }) => {
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);
  const phoneVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Faster video setup
    if (backgroundVideoRef.current) {
      backgroundVideoRef.current.playbackRate = 1.2;
    }
    setIsLoaded(true);
  }, []);

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (backgroundVideoRef.current) {
      backgroundVideoRef.current.muted = newMutedState;
    }
    if (phoneVideoRef.current) {
      phoneVideoRef.current.muted = newMutedState;
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Background Video - Lazy loaded */}
      {isLoaded && (
        <video
          ref={backgroundVideoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/videos/background-predio.mp4" type="video/mp4" />
        </video>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-purple-900/30 to-black/70" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content - Fast animation */}
        <div className={`space-y-8 transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black leading-tight">
              <span className="block text-white mb-2">PAINÉIS</span>
              <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                DIGITAIS
              </span>
              <span className="block text-white text-3xl md:text-4xl font-light mt-4">
                nos elevadores
              </span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 max-w-lg leading-relaxed">
            Modernize a comunicação do seu condomínio com painéis digitais gerenciados via 
            <span className="text-green-400 font-semibold"> WhatsApp + IA</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 px-8 rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105"
              onClick={() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Quero no Meu Prédio
              <ArrowDown className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Right Content - Phone Mockup with faster animation */}
        <div className={`relative transition-all duration-600 delay-200 ${
          isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'
        }`}>
          {/* Phone Frame */}
          <div className="relative w-80 h-[600px] mx-auto bg-gradient-to-b from-gray-800 to-black rounded-[3rem] p-4 shadow-2xl border border-gray-700">
            <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
              {/* Status Bar */}
              <div className="bg-black p-3 flex justify-between text-white text-sm">
                <span>9:41</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-2 bg-white rounded-sm"></div>
                  <div className="w-1 h-2 bg-white rounded-sm"></div>
                </div>
              </div>

              {/* WhatsApp Header */}
              <div className="bg-green-600 p-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">IN</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Indexa Mídia</h3>
                  <p className="text-green-100 text-xs">online</p>
                </div>
              </div>

              {/* Video Content - Only load when visible */}
              {isLoaded && (
                <video
                  ref={phoneVideoRef}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                >
                  <source src="/videos/painel-demo.mp4" type="video/mp4" />
                </video>
              )}

              {/* Mute Toggle Button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/90 transition-all duration-300 shadow-lg"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator - Fast animation */}
      <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-400 delay-400 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        <div className="animate-bounce">
          <ArrowDown className="w-6 h-6 text-white/70" />
        </div>
      </div>
    </section>
  );
});

FastHeroSection.displayName = 'FastHeroSection';

export default FastHeroSection;