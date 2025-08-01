import React from 'react';
import ModernSkeleton from './ModernSkeleton';

const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header skeleton */}
      <div className="h-16 bg-background border-b">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <ModernSkeleton variant="button" className="w-24" />
          <div className="flex space-x-4">
            <ModernSkeleton variant="button" className="w-20" />
            <ModernSkeleton variant="button" className="w-20" />
            <ModernSkeleton variant="button" className="w-20" />
          </div>
        </div>
      </div>

      {/* Hero section skeleton */}
      <div className="container mx-auto px-4 py-8">
        <ModernSkeleton variant="hero" className="mb-8" />
        
        {/* Content sections */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernSkeleton variant="card" />
            <ModernSkeleton variant="card" />
          </div>
          
          <div className="space-y-4">
            <ModernSkeleton variant="text" className="w-1/2" />
            <ModernSkeleton variant="text" className="w-3/4" />
            <ModernSkeleton variant="text" className="w-2/3" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernSkeleton variant="card" />
            <ModernSkeleton variant="card" />
            <ModernSkeleton variant="card" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;