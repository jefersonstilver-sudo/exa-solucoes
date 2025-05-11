
import React from 'react';
import { Users, Eye, Monitor, Tv } from 'lucide-react';

interface PanelStatsProps {
  estimatedResidents: number;
  monthlyViews: number;
  screenCount?: number;
  resolution?: string;
  mode?: string;
}

export const PanelStats: React.FC<PanelStatsProps> = ({ 
  estimatedResidents, 
  monthlyViews, 
  screenCount = 1,
  resolution = "1080x1920",
  mode = "indoor"
}) => {
  // Use formatters for better number display
  const formatNumber = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-sm text-gray-700 mb-3">Estatísticas do Painel</h4>
      
      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        {/* Residents */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1.5 rounded-md">
            <Users className="h-4 w-4 text-indexa-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">+{formatNumber(estimatedResidents)}</p>
            <p className="text-xs text-gray-500">moradores impactados</p>
          </div>
        </div>
        
        {/* Monthly views */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1.5 rounded-md">
            <Eye className="h-4 w-4 text-indexa-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">+{formatNumber(monthlyViews)}</p>
            <p className="text-xs text-gray-500">views/mês</p>
          </div>
        </div>
        
        {/* Screens */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1.5 rounded-md">
            <Monitor className="h-4 w-4 text-indexa-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{screenCount}</p>
            <p className="text-xs text-gray-500">tela{screenCount !== 1 ? 's' : ''} instalada{screenCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {/* Resolution */}
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1.5 rounded-md">
            <Tv className="h-4 w-4 text-indexa-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{resolution}</p>
            <p className="text-xs text-gray-500">{mode === "indoor" ? "Painel interno" : "Painel externo"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
