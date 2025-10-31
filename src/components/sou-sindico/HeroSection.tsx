import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, Volume, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  isVisible: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isVisible }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (backgroundVideoRef.current) {
      // Reduzir a velocidade do vídeo de fundo para 0.7x
      backgroundVideoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-24 md:pt-32 pb-20 overflow-hidden">
      {/* Background Video */}
      <video
        ref={backgroundVideoRef}
        className="absolute inset-0 w-full h-full object-cover blur-md"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Videos%20sindico%20site/F5D2914A-D793-496A-93DE-E5DB8F60E800.MOV?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy9WaWRlb3Mgc2luZGljbyBzaXRlL0Y1RDI5MTRBLUQ3OTMtNDk2QS05M0RFLUU1REI4RjYwRTgwMC5NT1YiLCJpYXQiOjE3NDg3MDA3NzYsImV4cCI6MTc4MDIzNjc3Nn0.8TYDnwI7JHfKTgUaiAhHoWz9aCtfTcIRlrj6vUqLJSQ" type="video/mp4" />
      </video>
      
      {/* Dark Overlay - mais escuro */}
      <div className="absolute inset-0 bg-black/75" />
      
      {/* Additional Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9C1E1E]/30 via-gray-900/20 to-[#180A0A]/30" />
      
      <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[#D72638] to-[#9C1E1E] bg-clip-text text-transparent">
              Substitua avisos de papel
            </span>
            <span className="block text-white">
              por painéis digitais modernos.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
            Gerencie tudo direto pelo WhatsApp. Painéis digitais + IA = Comunicação simples e eficiente.
          </p>
          
          <p className="text-lg text-gray-400 mb-8 italic">
            Imagine gerenciar seu prédio com facilidade, sentindo a proximidade com moradores
          </p>
          
          <Button 
            className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] hover:from-[#D72638] hover:to-[#9C1E1E] text-white text-lg px-8 py-6 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105"
            onClick={() => document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Quero modernizar meu prédio
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className={`flex justify-center lg:justify-end transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
          <div className="relative max-w-xs mx-auto transform -translate-y-4 mb-16">
            <div className="relative bg-gray-800 rounded-[2.8rem] p-3 shadow-2xl">
              <div className="bg-black rounded-[2.3rem] overflow-hidden aspect-[9/19.5] relative">
                <div className="h-8 bg-black relative flex items-center justify-center">
                  <div className="w-20 h-1.5 bg-gray-600 rounded-full" />
                </div>
                
                <video
                  ref={videoRef}
                  className="w-full object-cover"
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: 'calc(100% - 32px)',
                    objectFit: 'cover',
                    objectPosition: 'center 10%'
                  }}
                >
                  <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/Videos%20sindico%20site/2dac60f0-421e-4729-ac22-0d32dc360292.MP4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9WaWRlb3Mgc2luZGljbyBzaXRlLzJkYWM2MGYwLTQyMWUtNDcyOS1hYzIyLTBkMzJkYzM2MDI5Mi5NUDQiLCJpYXQiOjE3NTM4MzU0NzAsImV4cCI6OTYzNjE4MzU0NzB9.D2q27A9ZsqQbDLEtpjQEhTDJKLQKRtZwpITjUFNkzeg" type="video/mp4" />
                </video>
              </div>
            </div>
            
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={toggleMute}
                className="bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] hover:from-[#D72638] hover:to-[#9C1E1E] text-white border-0 shadow-lg px-4 py-2 rounded-full transform transition-all duration-300 hover:scale-105"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Assistir com som
                  </>
                ) : (
                  <>
                    <Volume className="w-4 h-4 mr-2" />
                    Silenciar
                  </>
                )}
              </Button>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-[#D72638]/20 to-[#9C1E1E]/20 rounded-[2.8rem] blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
