import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VideoWatermark } from '@/components/video-security/VideoWatermark';

interface Video {
  id: string;
  video_url: string;
  video_nome: string;
}

interface CommercialVideoHeroProps {
  videos: Video[];
  className?: string;
}

export const CommercialVideoHero: React.FC<CommercialVideoHeroProps> = ({
  videos,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const transitionLockRef = useRef(false);

  // Reset index when videos change
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [videos]);

  // Handle video playback and transitions
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videos.length === 0) return;

    const handleCanPlay = () => {
      if (!isPlaying) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    const handleEnded = () => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;

      const nextIndex = (currentIndex + 1) % videos.length;
      setCurrentIndex(nextIndex);
      setIsPlaying(false);

      setTimeout(() => {
        transitionLockRef.current = false;
      }, 500);
    };

    const handleError = () => {
      if (transitionLockRef.current) return;
      transitionLockRef.current = true;

      const nextIndex = (currentIndex + 1) % videos.length;
      setCurrentIndex(nextIndex);
      setIsPlaying(false);

      setTimeout(() => {
        transitionLockRef.current = false;
      }, 1000);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // Try to play if video is already ready
    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, videos.length, isPlaying]);

  if (videos.length === 0) {
    return (
      <div className={cn(
        "w-full aspect-video bg-black rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-white/60">Nenhum vídeo disponível</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div 
      className={cn(
        "relative w-full aspect-video bg-black rounded-lg overflow-hidden",
        className
      )}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        key={currentVideo.id}
        src={currentVideo.video_url}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
      />

      <VideoWatermark />

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
};
