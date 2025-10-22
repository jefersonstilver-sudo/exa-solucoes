import React, { useRef, useState, useEffect } from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaCard from '@/components/exa/base/ExaCard';
import ExaPanel from '@/components/exa/sindico/ExaPanel';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { VideoPlayerControls } from '@/components/video-management/VideoPlayerControls';
import { Clock, Cloud, Gem, Film } from 'lucide-react';
const NovaComunicacaoSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const { data: config, isLoading } = useVideoConfig();
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // Inicia em autoplay
  const [isMuted, setIsMuted] = useState(true); // Inicia mudo
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Video control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const handleProgressChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    
    const newTime = (value[0] / 100) * duration;
    video.currentTime = newTime;
    setProgress(value[0]);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update time and progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);
  const benefits = [{
    icon: Clock,
    title: 'Publicação Instantânea',
    description: 'Envie comunicados em segundos pelo painel administrativo.'
  }, {
    icon: Cloud,
    title: 'Informação Útil',
    description: 'Exiba mensagens do síndico, clima, câmbio e avisos relevantes.'
  }, {
    icon: Gem,
    title: 'Ambiente Premium',
    description: 'Modernize o elevador e valorize o imóvel.'
  }];
  return <ExaSection background="light" className="py-24">
      <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Painel com Vídeo */}
          <div className="order-2 lg:order-1">
            <ExaPanel>
              {config?.video_principal_url ? (
                <div 
                  ref={containerRef}
                  className="relative w-full h-full group"
                  onMouseEnter={() => setShowControls(true)}
                  onMouseLeave={() => setShowControls(false)}
                >
                  <video
                    ref={videoRef}
                    src={config.video_principal_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    poster="/placeholder.svg"
                    onClick={togglePlay}
                  >
                    Seu navegador não suporta vídeos.
                  </video>
                  {showControls && (
                    <VideoPlayerControls
                      toggleFullscreen={toggleFullscreen}
                      isPlaying={isPlaying}
                      togglePlay={togglePlay}
                      currentTime={currentTime}
                      formatTime={formatTime}
                      progress={progress}
                      handleProgressChange={handleProgressChange}
                      duration={duration}
                      restart={restart}
                      isMuted={isMuted}
                      volume={volume}
                      toggleMute={toggleMute}
                      handleVolumeChange={handleVolumeChange}
                      showCenterButton={true}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                  <Film className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="font-poppins text-gray-500 text-center px-4 text-sm">
                    🎥 Vídeo Institucional<br />
                    <span className="text-xs">editável no painel administrativo</span>
                  </p>
                </div>
              )}
            </ExaPanel>
          </div>
          
          {/* Conteúdo */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <h2 className="font-montserrat font-bold text-4xl lg:text-5xl text-exa-purple mb-4">
                Mais que um painel.<br />
                Um novo canal de convivência.
              </h2>
              <p className="font-poppins text-lg text-gray-700 leading-relaxed">
                A EXA substitui os antigos murais impressos por um sistema digital moderno e intuitivo.
                Os comunicados são exibidos automaticamente nas telas dos elevadores, junto a conteúdos úteis 
                e mensagens publicitárias.
              </p>
              <p className="font-poppins text-lg text-gray-700 leading-relaxed mt-4">
                O resultado é um ambiente mais organizado, valorizado e conectado.
              </p>
            </div>
            
            {/* Mini cards */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => <ExaCard key={index} variant="light" className="p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-exa-purple to-exa-blue rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-xl text-exa-black mb-1">
                        {benefit.title}
                      </h3>
                      <p className="font-poppins text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </ExaCard>)}
            </div>
          </div>
        </div>
      </div>
    </ExaSection>;
};
export default NovaComunicacaoSection;