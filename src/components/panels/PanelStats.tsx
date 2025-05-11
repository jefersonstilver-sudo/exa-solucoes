
import React from 'react';
import { Users, Eye, Monitor } from 'lucide-react';

interface PanelStatsProps {
  estimatedResidents: number;
  monthlyViews: number;
  screenCount?: number;
}

export const PanelStats: React.FC<PanelStatsProps> = ({ 
  estimatedResidents, 
  monthlyViews, 
  screenCount = 1 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Residents */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-lg font-semibold text-gray-800">+{estimatedResidents}</p>
          <p className="text-sm text-gray-500">moradores impactados</p>
        </div>
      </div>
      
      {/* Monthly views */}
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-lg font-semibold text-gray-800">+{monthlyViews.toLocaleString('pt-BR')}</p>
          <p className="text-sm text-gray-500">views/mês</p>
        </div>
      </div>
      
      {/* Screens */}
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-gray-500" />
        <div>
          <p className="text-lg font-semibold text-gray-800">{screenCount}</p>
          <p className="text-sm text-gray-500">tela{screenCount !== 1 ? 's' : ''} instalada{screenCount !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
};
