
import React from 'react';
import { RefreshCw } from 'lucide-react';

const BuildingsPageLoader: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
        <span className="ml-2 text-gray-900 font-medium">Carregando prédios...</span>
      </div>
    </div>
  );
};

export default BuildingsPageLoader;
