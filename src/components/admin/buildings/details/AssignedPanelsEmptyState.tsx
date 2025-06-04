
import React from 'react';
import { Monitor } from 'lucide-react';

const AssignedPanelsEmptyState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Nenhum painel atribuído
      </h3>
      <p className="text-gray-500">
        Este prédio ainda não possui painéis atribuídos.
      </p>
    </div>
  );
};

export default AssignedPanelsEmptyState;
