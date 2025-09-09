
import React from 'react';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

interface LazyLoadingFallbackProps {
  message?: string;
}

const LazyLoadingFallback: React.FC<LazyLoadingFallbackProps> = ({ 
  message = "" 
}) => {
  return <GlobalLoadingPage message={message} />;
};

export default LazyLoadingFallback;
