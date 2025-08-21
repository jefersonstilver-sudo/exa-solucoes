import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';

interface LogoImageProps {
  logo: {
    file_url: string;
    storage_bucket?: string;
    storage_key?: string;
    name: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LogoImage: React.FC<LogoImageProps> = ({ logo, className = '', size = 'md' }) => {
  const { imageUrl, loading } = useLogoImageUrl(logo);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const containerClass = `
    ${sizeClasses[size]} flex-shrink-0 bg-muted rounded-lg flex items-center justify-center overflow-hidden border
    ${className}
  `;

  if (loading) {
    return (
      <div className={containerClass}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={containerClass}>
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <img
        src={imageUrl}
        alt={logo.name}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(e) => {
          // Fallback em caso de erro na imagem
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.remove(); // Remove o ícone se existir
          const parent = target.parentElement;
          if (parent) {
            const icon = document.createElement('div');
            icon.className = 'h-4 w-4 text-muted-foreground flex items-center justify-center';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
            parent.appendChild(icon);
          }
        }}
      />
    </div>
  );
};

export default LogoImage;