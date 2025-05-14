
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingPanelsProps {
  vertical?: boolean;
  count?: number;
}

const LoadingPanels: React.FC<LoadingPanelsProps> = ({ 
  vertical = false, 
  count = 3 
}) => {
  if (vertical) {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden border border-gray-200 rounded-2xl">
            <CardContent className="p-0">
              <div className="md:flex">
                <div className="w-full h-64 md:w-2/5 bg-gray-200 animate-pulse"></div>
                <div className="p-6 md:w-3/5 space-y-4">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                  
                  <div className="pt-4 flex justify-between items-center">
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-32 mt-1" />
                    </div>
                    <Skeleton className="h-12 w-44" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Original grid layout loading
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden border border-gray-200 rounded-2xl">
          <CardContent className="p-0">
            <div className="h-56 bg-gray-200 animate-pulse"></div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <div className="flex justify-between items-center pt-3">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoadingPanels;
