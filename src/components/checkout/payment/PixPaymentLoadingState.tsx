
import React from 'react';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

const PixPaymentLoadingState = () => {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center">
      <EnhancedLoadingSpinner 
        size="lg" 
        showText={true} 
        text="Carregando PIX..."
        variant="primary"
      />
    </div>
  );
};

export default PixPaymentLoadingState;
