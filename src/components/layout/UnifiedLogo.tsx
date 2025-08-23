import React from 'react';
import { Link } from 'react-router-dom';

interface UnifiedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  linkTo?: string;
  variant?: 'light' | 'dark';
  className?: string;
  logoUrl?: string;
  altText?: string;
  showSubtitle?: boolean;
}

const UnifiedLogo = ({ 
  size = 'md', 
  linkTo = '/', 
  variant = 'light',
  className = '',
  logoUrl,
  altText = 'Logo',
  showSubtitle = false
}: UnifiedLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    custom: '' // Para quando className define o tamanho
  };

  const filterClasses = {
    light: 'filter brightness-0 invert',
    dark: ''
  };

  const LogoImage = () => (
    <div className={`${size !== 'custom' ? sizeClasses[size] : ''} flex flex-col items-center justify-center ${className}`}>
      <img 
        src={logoUrl || "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png"}
        alt={logoUrl ? altText : "Indexa Logo"}
        className={`w-full h-auto object-contain mt-1 ${filterClasses[variant]} ${showSubtitle ? 'mb-1' : ''}`}
      />
      {false && (
        <span className={`text-xs font-medium text-center whitespace-nowrap ${variant === 'light' ? 'text-white' : 'text-gray-700'}`}>
          Publicidade inteligente
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
      >
        <LogoImage />
      </Link>
    );
  }

  return <LogoImage />;
};

export default UnifiedLogo;
