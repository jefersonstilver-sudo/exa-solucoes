
// 🔧 MODIFICAÇÃO DE PERFORMANCE/SEGURANÇA
import React from 'react';
import { Loader2 } from 'lucide-react';
import SkeletonLoader, { HeroSkeleton } from './SkeletonLoader';

interface LazyLoadingFallbackProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'hero';
}

const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({ 
  message = "Carregando página...",
  variant = 'spinner'
}) => {
  if (variant === 'hero') {
    return (
      <div className="min-h-screen bg-black">
        <HeroSkeleton />
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <SkeletonLoader variant="hero" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <SkeletonLoader variant="card" />
                <SkeletonLoader variant="text" lines={2} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00FFAB] mx-auto mb-4" />
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
};

export default LazyLoadingFallback;
