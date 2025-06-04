
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadingFallbackProps {
  message?: string;
}

const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({ 
  message = "Carregando..." 
}) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#3C1361] mx-auto mb-2" />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LazyLoadingFallback;
