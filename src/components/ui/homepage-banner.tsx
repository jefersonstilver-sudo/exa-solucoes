
import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HomepageBanner } from '@/hooks/useHomepageBanners';
import { Button } from '@/components/ui/button';

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

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
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

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Banner Image */}
      <div className="relative w-full h-full">
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title || 'Banner'}
          className="w-full h-full object-cover transition-opacity duration-500"
          loading="lazy"
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content Overlay */}
        {(currentBanner.title || currentBanner.subtitle) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-4 md:p-8">
              {currentBanner.title && (
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
                  {currentBanner.title}
                </h2>
              )}
              {currentBanner.subtitle && (
                <p className="text-sm md:text-lg lg:text-xl opacity-90 drop-shadow-lg">
                  {currentBanner.subtitle}
                </p>
              )}
              {currentBanner.link_url && (
                <Button 
                  className="mt-4 md:mt-6 bg-indexa-purple hover:bg-indexa-purple-dark"
                  onClick={() => window.location.href = currentBanner.link_url!}
                >
                  Saiba Mais
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 md:p-2 rounded-full transition-all duration-200 z-10"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 md:p-2 rounded-full transition-all duration-200 z-10"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dots Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
