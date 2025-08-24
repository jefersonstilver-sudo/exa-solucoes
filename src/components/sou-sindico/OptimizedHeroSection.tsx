import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

// Lazy load heavy video component
const VideoPlayer = lazy(() => import('./VideoPlayer'));

interface OptimizedHeroSectionProps {
  isVisible: boolean;
}

const OptimizedHeroSection: React.FC<OptimizedHeroSectionProps> = ({ isVisible }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Lazy load video only when hero is visible
    if (isVisible && !videoLoaded) {
      setVideoLoaded(true);
    }
  }, [isVisible, videoLoaded]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const scrollToForm = () => {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      {/* Optimized background video - only load when needed */}
      {videoLoaded && (
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover opacity-30"
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.7;
              }
            }}
          >
            <source src="/video/hero-background.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* Simple gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/50 to-gray-900/70 z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 text-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className={`space-y-6 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Painel Digital + WhatsApp
              </span>
              <br />
              <span className="text-white">
                no Elevador
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
              Transforme a comunicação do seu prédio com tecnologia gratuita
            </p>
            
            <Button 
              onClick={scrollToForm}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg transform transition-transform duration-200 hover:scale-105"
            >
              Solicitar Instalação Gratuita
            </Button>
          </div>

          {/* Phone mockup with lazy loaded video */}
          <div className={`relative transition-all duration-500 delay-200 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
            <div className="relative w-80 h-[600px] mx-auto">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-4 shadow-2xl">
                <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative">
                  {videoLoaded ? (
                    <Suspense fallback={
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    }>
                      <VideoPlayer 
                        ref={videoRef}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                      />
                    </Suspense>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 text-sm">Carregando preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Mute button */}
              <button
                onClick={toggleMute}
                className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-sm p-3 rounded-full hover:bg-white/30 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OptimizedHeroSection;