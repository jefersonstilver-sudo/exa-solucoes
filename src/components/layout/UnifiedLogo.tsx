
import React from 'react';
import { Link } from 'react-router-dom';

interface UnifiedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  linkTo?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

const UnifiedLogo = ({ 
  size = 'md', 
  linkTo = '/', 
  variant = 'light',
  className = '' 
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
    <div className={`${size !== 'custom' ? sizeClasses[size] : ''} flex items-center justify-center ${className}`}>
      <img 
        src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/1%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzLzEgKDEpLnBuZyIsImlhdCI6MTc1MzgxNTIwNCwiZXhwIjo5NjM2MTgxNTIwNH0.KlH5Ty2cfiwFR5rmrTRHOdW7cybUCRQqS3Bfg6Qy8dg"
        alt="INDEXA Logo" 
        className={`w-full h-full object-contain ${filterClasses[variant]}`}
      />
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
