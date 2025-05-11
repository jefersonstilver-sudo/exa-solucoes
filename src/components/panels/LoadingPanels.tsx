
import React from 'react';

interface LoadingPanelsProps {
  count?: number;
}

const LoadingPanels: React.FC<LoadingPanelsProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="md:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingPanels;
