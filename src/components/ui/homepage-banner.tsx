
import React, { useEffect, useState, useCallback } from 'react';
import { HomepageBanner } from '@/hooks/useHomepageBanners';

interface HomepageBannerCarouselProps {
  banners: HomepageBanner[];
  className?: string;
  autoPlayInterval?: number;
}

export const HomepageBannerCarousel: React.FC<HomepageBannerCarouselProps> = ({
  banners,
  className = '',
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (banners.length === 0 || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      setIsTransitioning(false);
    }, 50);
  }, [banners.length, isTransitioning]);

  const goToSlide = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 50);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isAutoPlaying, banners.length]);

  // Pause auto-play on hover, resume on mouse leave
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  if (banners.length === 0) {
    return (
      <div className={`relative w-full h-full bg-gradient-to-r from-indexa-purple/20 to-purple-600/20 rounded-2xl border-2 border-dashed border-white/30 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">Banner Rotativo</h2>
          <p className="text-sm md:text-lg opacity-80">Configure banners no painel administrativo</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = () => {
    if (currentBanner.link_url) {
      window.open(currentBanner.link_url, '_blank');
    }
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Banner Images with Modern Transition Effects */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
              index === currentIndex 
                ? 'opacity-100 scale-100 z-10' 
                : 'opacity-0 scale-105 z-0'
            } ${banner.link_url ? 'cursor-pointer' : ''}`}
            onClick={index === currentIndex ? handleBannerClick : undefined}
            style={{
              transform: index === currentIndex 
                ? 'translateZ(0) scale(1)' 
                : 'translateZ(0) scale(1.05)',
              willChange: 'transform, opacity'
            }}
          >
            <img
              src={banner.image_url}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* Subtle overlay for better dot visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Modern Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative group transition-all duration-300 ease-out ${
                index === currentIndex ? 'scale-110' : 'scale-100 hover:scale-105'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            >
              {/* Outer ring */}
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-300 ${
                index === currentIndex 
                  ? 'border-white bg-white/20 shadow-lg shadow-white/25' 
                  : 'border-white/60 hover:border-white/80 bg-transparent'
              }`}>
                {/* Inner dot */}
                <div className={`absolute inset-1 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-100' 
                    : 'bg-white/40 scale-75 group-hover:bg-white/60 group-hover:scale-85'
                }`} />
                
                {/* Progress ring for current slide */}
                {index === currentIndex && (
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/80 animate-spin"
                    style={{
                      animation: `spin ${autoPlayInterval}ms linear infinite`
                    }}
                  />
                )}
              </div>
              
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                  : 'shadow-none group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
              }`} />
            </button>
          ))}
        </div>
      )}

      {/* Loading transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-black/10 z-30 transition-opacity duration-200" />
      )}
    </div>
  );
};
