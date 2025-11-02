import React, { useState, useRef, useEffect } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface OptimizedVideoSectionProps {
  videoUrl: string;
  title?: string;
  description?: string;
  className?: string;
}

const OptimizedVideoSection = React.memo(({ 
  videoUrl, 
  title, 
  description, 
  className = '' 
}: OptimizedVideoSectionProps) => {
  const { ref, isVisible } = useScrollReveal(0.2);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only load video when section is visible
    if (isVisible && videoRef.current && !isVideoLoaded) {
      setIsVideoLoaded(true);
    }
  }, [isVisible, isVideoLoaded]);

  return (
    <div ref={ref} className={className}>
      {title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-gray-300 mb-6">
          {description}
        </p>
      )}
      <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
        {isVideoLoaded ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            preload="metadata"
            playsInline
            className="w-full h-full object-cover"
            poster={`${videoUrl}#t=0.1`} // Thumbnail from first frame
          >
            Seu navegador não suporta vídeo.
          </video>
        ) : (
          // Placeholder while not loaded
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <div className="text-gray-400">Carregando vídeo...</div>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedVideoSection.displayName = 'OptimizedVideoSection';

export default OptimizedVideoSection;
