import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Film } from 'lucide-react';

const VideoPrincipalSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { data: config, isLoading } = useVideoConfig();

  return (
    <ExaSection background="transparent" className="py-16">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {config?.video_principal_url ? (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl">
            <video
              src={config.video_principal_url}
              controls
              className="w-full h-full object-cover"
              poster="/placeholder.svg"
            >
              Seu navegador não suporta vídeos.
            </video>
          </div>
        ) : (
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center border-2 border-dashed border-gray-700">
            <Film className="w-20 h-20 text-gray-600 mb-4" />
            <p className="font-poppins text-gray-500 text-center px-4">
              🎥 Vídeo Institucional<br />
              <span className="text-sm">editável no painel administrativo</span>
            </p>
          </div>
        )}
      </div>
    </ExaSection>
  );
};

export default VideoPrincipalSection;
