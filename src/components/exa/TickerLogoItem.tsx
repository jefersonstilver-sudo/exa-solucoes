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
}

const TickerLogoItem: React.FC<TickerLogoItemProps> = ({ 
    logo, 
    className = '',
    onImageLoad,
    onImageError
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

  const handleClick = () => {
    if (logo.link_url) {
      window.open(logo.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if loading or error
  if (loading || !imageUrl || imageError) {
    return null;
  }

  return (
    <div 
      className={`flex items-center justify-center p-4 ${className}`}
      onClick={handleClick}
      style={{ cursor: logo.link_url ? 'pointer' : 'default' }}
    >
      <img
        src={imageUrl}
        alt={logo.name}
        className="max-h-16 max-w-40 object-contain opacity-70 hover:opacity-100 transition-all duration-300"
        style={{ transform: `scale(${scaleFactor})` }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default TickerLogoItem;