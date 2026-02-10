import React, { useState } from 'react';
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';

interface TickerLogoItemProps {
  logo: {
    id: string;
    name: string;
    file_url: string;
    storage_bucket?: string;
    storage_key?: string;
    color_variant?: string;
    link_url?: string;
    scale_factor?: number;
  };
  className?: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
}

const TickerLogoItem: React.FC<TickerLogoItemProps> = ({ 
    logo, 
    className = '',
    onImageLoad,
    onImageError,
    onClick,
    isSelected = false
}) => {
  const scaleFactor = logo.scale_factor || 1;
  const { imageUrl, loading } = useLogoImageUrl(logo);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.warn(`Failed to load logo image: ${imageUrl} for logo: ${logo.name}`);
    setImageError(true);
    onImageError?.();
  };

  const handleImageLoad = () => {
    setImageError(false);
    onImageLoad?.();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
      return;
    }
    if (logo.link_url) {
      window.open(logo.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if loading or error
  if (loading || !imageUrl || imageError) {
    return null;
  }

  const hasInteraction = !!onClick || !!logo.link_url;

  return (
    <div 
      className={`flex items-center justify-center p-2 md:p-4 transition-all duration-300 ease-out ${
        isSelected 
          ? 'ring-2 ring-white shadow-lg shadow-white/20 scale-105 z-10 rounded-lg bg-white/10' 
          : ''
      } ${className}`}
      onClick={handleClick}
      style={{ cursor: hasInteraction ? 'pointer' : 'default', transform: `scale(${scaleFactor})` }}
    >
      <img
        src={imageUrl}
        alt={logo.name}
        className={`max-h-12 md:max-h-16 max-w-28 md:max-w-40 object-contain transition-all duration-300 brightness-0 invert ${
          isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
        }`}
        
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default TickerLogoItem;
