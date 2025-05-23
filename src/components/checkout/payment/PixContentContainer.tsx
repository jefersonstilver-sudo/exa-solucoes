
import React, { ReactNode } from 'react';

interface PixContentContainerProps {
  children: ReactNode;
}

const PixContentContainer = ({ children }: PixContentContainerProps) => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {children}
    </div>
  );
};

export default PixContentContainer;
