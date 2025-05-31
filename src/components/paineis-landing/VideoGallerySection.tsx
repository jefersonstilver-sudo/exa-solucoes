
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const VideoGallerySection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Vídeos em mosaico cinemático (usando placeholders)
  const videos = [
    {
      src: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80',
      title: 'Pincelada Visual 1',
      description: 'Sua marca aparece de forma sutil mas marcante',
      isVideo: false // placeholder image
    },
    {
      src: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80',
      title: 'Pincelada Visual 2', 
      description: 'Fragmentos que constroem memória visual',
      isVideo: false // placeholder image
    },
    {
      src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
      title: 'Pincelada Visual 3',
      description: 'Presença constante sem saturação',
      isVideo: false // placeholder image
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoToggle = (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (playingVideo === index) {
      video.pause();
      setPlayingVideo(null);
    } else {
      // Pausar outros vídeos
      videoRefs.current.forEach((v, i) => {
        if (v && i !== index) {
          v.pause();
        }
      });
      video.play();
      setPlayingVideo(index);
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center py-20 px-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className={`transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
        }`}>
          {/* Título da Seção */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
            <span className="bg-gradient-to-r from-indexa-mint to-white bg-clip-text text-transparent glow-text">
              Galeria Vídeo Pinceladas
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-16 text-center max-w-4xl mx-auto leading-relaxed">
            Pinceladas visuais que marcam presença sem saturar
          </p>

          {/* Mosaico Cinemático */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {videos.map((video, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-2xl shadow-2xl transform transition-all duration-700 hover:scale-105 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Container do vídeo/imagem */}
                <div className="relative aspect-video bg-gray-900">
                  {video.isVideo ? (
                    <video
                      ref={(el) => {videoRefs.current[index] = el}}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                    >
                      <source src={video.src} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={video.src}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Overlay escuro */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500" />
                  
                  {/* Botão de play (apenas para vídeos futuros) */}
                  {video.isVideo && (
                    <button
                      onClick={() => handleVideoToggle(index)}
                      className="absolute inset-0 flex items-center justify-center text-white hover:text-indexa-mint transition-colors duration-300"
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-indexa-mint/30 transition-all duration-300">
                        {playingVideo === index ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </div>
                    </button>
                  )}

                  {/* Indicador de placeholder */}
                  {!video.isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-indexa-purple/80 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm font-medium">Preview Visual</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Informações sobre o vídeo */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white font-bold text-lg mb-2">{video.title}</h3>
                    <p className="text-white/80 text-sm">{video.description}</p>
                  </div>

                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indexa-mint/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </div>
            ))}
          </div>

          {/* Explicação do conceito */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-indexa-purple/20 to-indexa-mint/20 backdrop-blur-sm p-8 rounded-2xl border border-indexa-mint/30 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">
                <span className="text-indexa-mint">Estratégia das Pinceladas:</span> Presença Sutil e Eficaz
              </h3>
              <p className="text-white/90 text-lg leading-relaxed mb-4">
                Sua marca não interrompe, ela se integra. Pequenos fragmentos visuais que se acumulam na memória do público, 
                criando reconhecimento sem saturação.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
                <div>
                  <span className="text-indexa-mint font-semibold">15 segundos</span><br />
                  Duração ideal por exposição
                </div>
                <div>
                  <span className="text-indexa-mint font-semibold">Não invasivo</span><br />
                  Integrado ao conteúdo útil
                </div>
                <div>
                  <span className="text-indexa-mint font-semibold">Alta frequência</span><br />
                  Múltiplas exposições diárias
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;
