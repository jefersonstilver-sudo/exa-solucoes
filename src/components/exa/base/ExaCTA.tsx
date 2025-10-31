import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ExaCTAProps {
  children: React.ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const ExaCTA = ({ 
  children, 
  to, 
  href, 
  onClick, 
  className, 
  variant = 'primary',
  size = 'md' 
}: ExaCTAProps) => {
  const baseClasses = 'inline-flex items-center justify-center font-montserrat font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#9C1E1E] to-[#180A0A] text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-exa-yellow text-exa-black shadow-lg hover:shadow-xl',
    outline: 'bg-transparent border-2 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white',
  };

  const sizeClasses = {
    sm: 'px-4 md:px-6 py-2 text-sm',
    md: 'px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base',
    lg: 'px-8 md:px-10 py-3 md:py-4 text-base md:text-lg',
  };

  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default ExaCTA;
