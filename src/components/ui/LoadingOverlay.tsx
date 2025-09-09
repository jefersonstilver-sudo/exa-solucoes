
import React from 'react';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Carregando...',
  children
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <EnhancedLoadingSpinner 
          size="lg" 
          showText={true} 
          text={message}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default LoadingOverlay;
