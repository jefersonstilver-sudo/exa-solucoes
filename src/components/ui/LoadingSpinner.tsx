
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#1E1B4B' 
}) => {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };
  
  const sizeClass = sizeMap[size];
  
  return (
    <div className={`${sizeClass} border-4 border-t-transparent rounded-full animate-spin`} 
      style={{ borderColor: `${color} ${color} ${color} transparent` }}
    />
  );
};

export default LoadingSpinner;
