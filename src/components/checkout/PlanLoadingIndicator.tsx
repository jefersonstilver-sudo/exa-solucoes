
import React from 'react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PlanLoadingIndicatorProps {
  message?: string;
}

const PlanLoadingIndicator: React.FC<PlanLoadingIndicatorProps> = ({ 
  message = "Verificando sua sessão e carrinho..." 
}) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-3">{message}</span>
      </div>
    </Layout>
  );
};

export default PlanLoadingIndicator;
