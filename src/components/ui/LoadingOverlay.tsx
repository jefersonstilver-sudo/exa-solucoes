
import React from 'react';
import { RefreshCw } from 'lucide-react';

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
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple mx-auto mb-2" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
