
import React from 'react';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

const MinimalLoader: React.FC = () => {
  return <GlobalLoadingPage message="Carregando aplicação..." />;
};

export default MinimalLoader;
