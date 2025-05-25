
import React from 'react';
import { Clock } from 'lucide-react';
import { formatLastSync } from './PanelStatusConfig';

interface PanelCardContentProps {
  resolucao?: string;
  modo?: string;
  ultima_sync?: string;
}

const PanelCardContent: React.FC<PanelCardContentProps> = ({
  resolucao,
  modo,
  ultima_sync
}) => {
  return (
    <div className="space-y-4">
      {/* Informações Técnicas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/60 p-3 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Resolução</div>
          <div className="font-medium text-sm">
            {resolucao || 'N/A'}
          </div>
        </div>
        <div className="bg-white/60 p-3 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Modo</div>
          <div className="font-medium text-sm">
            {modo || 'N/A'}
          </div>
        </div>
      </div>

      {/* Última Sincronização */}
      <div className="bg-white/60 p-3 rounded-lg">
        <div className="flex items-center space-x-2 mb-1">
          <Clock className="h-3 w-3 text-gray-600" />
          <span className="text-xs text-gray-600">Última Sincronização</span>
        </div>
        <div className="font-medium text-sm">
          {formatLastSync(ultima_sync)}
        </div>
      </div>
    </div>
  );
};

export default PanelCardContent;
