
import React from 'react';
import Layout from '@/components/layout/Layout';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

interface PlanLoadingIndicatorProps {
  message?: string;
}

const PlanLoadingIndicator: React.FC<PlanLoadingIndicatorProps> = ({ 
  message = "Verificando sua sessão e carrinho..." 
}) => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[50vh]">
        <EnhancedLoadingSpinner 
          size="lg" 
          showText={true} 
          text={message}
          variant="primary"
        />
      </div>
    </Layout>
  );
};

export default PlanLoadingIndicator;
