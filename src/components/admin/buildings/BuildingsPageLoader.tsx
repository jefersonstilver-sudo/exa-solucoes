
import React from 'react';
import { RefreshCw } from 'lucide-react';
import EnhancedLoadingSpinner from '@/components/loading/EnhancedLoadingSpinner';

const BuildingsPageLoader: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <EnhancedLoadingSpinner 
          size="lg" 
          showText={true} 
          text="Carregando prédios..."
          variant="primary"
        />
      </div>
    </div>
  );
};

export default BuildingsPageLoader;
