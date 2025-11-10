import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaPanel from '@/components/exa/sindico/ExaPanel';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Film } from 'lucide-react';

const VideoPrincipalSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { data: config, isLoading } = useVideoConfig();

  if (isLoading) {
    return null;
  }

  return (
    <ExaSection background="transparent" className="py-16">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <ExaPanel>
          {config?.video_principal_url ? (
            <video
              src={config.video_principal_url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              Seu navegador não suporta vídeos.
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black">
              <Film className="w-16 h-16 text-gray-600 mb-4" />
              <p className="font-poppins text-gray-500 text-center px-4 text-sm">
                🎥 Vídeo Principal<br />
                <span className="text-xs">editável no painel</span>
              </p>
            </div>
          )}
        </ExaPanel>
      </div>
    </ExaSection>
  );
};

export default VideoPrincipalSection;