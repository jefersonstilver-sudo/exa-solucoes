
import React, { ReactNode } from 'react';

interface StoreLayoutProps {
  children: ReactNode;
}

const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default StoreLayout;
