import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import ExaPanel from '@/components/exa/sindico/ExaPanel';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { Film } from 'lucide-react';

const DesignValorizaSection = () => {
  const { ref, isVisible } = useScrollReveal();
  const { data: config } = useVideoConfig();

  return (
    <ExaSection background="light" className="py-24">
      <div 
        ref={ref}
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo */}
          <div className="space-y-6">
            <h2 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-5xl text-exa-purple">
              Elegância e integração visual.
            </h2>
            <p className="font-poppins text-base md:text-lg text-gray-700 leading-relaxed">
              As telas EXA são projetadas para se integrar de forma harmônica ao elevador.
              O brilho é calibrado, os contrastes são equilibrados e o design se adapta à 
              estética de cada prédio.
            </p>
            <p className="font-poppins text-base md:text-lg text-gray-700 leading-relaxed">
              Cada instalação é pensada para valorizar o ambiente, transformando o elevador 
              em um espaço moderno e sofisticado que impressiona moradores e visitantes.
            </p>
          </div>
          
          {/* Painel EXA 3D - Vídeo editável pelo painel administrativo */}
          <div className="flex items-center justify-center">
            <ExaPanel>
              {config?.video_secundario_url ? (
                <video
                  src={config.video_secundario_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  Seu navegador não suporta vídeos.
                </video>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-exa-purple/20 via-black to-black flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <Film className="w-16 h-16 text-white/40 mb-4" />
                    <div className="text-white/40 text-sm font-poppins">
                      Vídeo de demonstração
                    </div>
                    <div className="text-white/20 text-xs">
                      Gerenciável pelo painel administrativo
                    </div>
                  </div>
                </div>
              )}
            </ExaPanel>
          </div>
        </div>
      </div>
    </ExaSection>
  );
};

export default DesignValorizaSection;
