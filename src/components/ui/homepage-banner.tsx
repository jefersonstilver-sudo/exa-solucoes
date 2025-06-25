
import React, { useEffect, useState, useCallback } from 'react';
import { HomepageBanner } from '@/hooks/useHomepageBanners';

interface HomepageBannerCarouselProps {
  banners: HomepageBanner[];
  className?: string;
  autoPlayInterval?: number;
}

export const HomepageBannerCarousel: React.FC<HomepageBannerCarouselProps> = ({
  banners = [],
  className = '',
  autoPlayInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  console.log('🎨 [HomepageBanner] Renderizando:', {
    bannersCount: banners.length,
    currentIndex,
    isAutoPlaying,
    imageLoaded
  });

  const nextSlide = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
  };

  // Auto-play funcional
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isAutoPlaying, banners.length]);

  // Controles de hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  // Placeholder quando não há banners ou estão carregando
  if (!banners || banners.length === 0) {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bem-vindo à Indexa</h2>
          <p className="text-lg md:text-xl opacity-90">Soluções completas em marketing digital</p>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  const handleBannerClick = () => {
    if (currentBanner?.link_url) {
      window.open(currentBanner.link_url, '_blank');
    }
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Banner Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            } ${banner.link_url ? 'cursor-pointer' : ''}`}
            onClick={index === currentIndex ? handleBannerClick : undefined}
          >
            <img
              src={banner.image_url}
              alt={banner.title || 'Banner da Indexa'}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.log('❌ [HomepageBanner] Erro ao carregar imagem:', banner.image_url);
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80';
              }}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Título */}
            {banner.title && (
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <h3 className="text-xl md:text-2xl font-bold mb-2">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-sm md:text-base opacity-90">{banner.subtitle}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white scale-110' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
