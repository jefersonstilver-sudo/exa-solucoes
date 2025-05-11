
import React from 'react';
import { Users, Eye, Monitor, Tv, Clock, Tag } from 'lucide-react';

interface PanelStatsProps {
  estimatedResidents: number;
  monthlyViews: number;
  screenCount?: number;
  resolution?: string;
  mode?: string;
  isCommercial?: boolean;
  peakHours?: string;
}

export const PanelStats: React.FC<PanelStatsProps> = ({ 
  estimatedResidents, 
  monthlyViews, 
  screenCount = 1,
  resolution = "1080x1920",
  mode = "indoor",
  isCommercial = false,
  peakHours
}) => {
  // Use formatters for better number display
  const formatNumber = (num: number) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className={`rounded-lg p-4 mb-6 ${isCommercial ? 'bg-[#00F894]/5' : 'bg-gray-50'}`}>
      <h4 className="font-medium text-sm text-gray-700 mb-3">Estatísticas do Painel</h4>
      
      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
        {/* Residents or Traffic */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isCommercial ? 'bg-[#00F894]/10' : 'bg-gray-100'}`}>
            {isCommercial ? (
              <Tag className="h-4 w-4 text-[#00F894]" />
            ) : (
              <Users className="h-4 w-4 text-indexa-purple" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">+{formatNumber(isCommercial ? monthlyViews : estimatedResidents)}</p>
            <p className="text-xs text-gray-500">
              {isCommercial ? 'visitantes/mês' : 'moradores impactados'}
            </p>
          </div>
        </div>
        
        {/* Monthly views or Peak hours */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isCommercial ? 'bg-[#00F894]/10' : 'bg-gray-100'}`}>
            {isCommercial ? (
              <Clock className="h-4 w-4 text-[#00F894]" />
            ) : (
              <Eye className="h-4 w-4 text-indexa-purple" />
            )}
          </div>
          <div>
            {isCommercial && peakHours ? (
              <>
                <p className="text-sm font-medium text-gray-800">{peakHours}</p>
                <p className="text-xs text-gray-500">horário de pico</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-800">+{formatNumber(monthlyViews)}</p>
                <p className="text-xs text-gray-500">views/mês</p>
              </>
            )}
          </div>
        </div>
        
        {/* Screens */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isCommercial ? 'bg-[#00F894]/10' : 'bg-gray-100'}`}>
            <Monitor className={`h-4 w-4 ${isCommercial ? 'text-[#00F894]' : 'text-indexa-purple'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{screenCount}</p>
            <p className="text-xs text-gray-500">tela{screenCount !== 1 ? 's' : ''} instalada{screenCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        {/* Resolution */}
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isCommercial ? 'bg-[#00F894]/10' : 'bg-gray-100'}`}>
            <Tv className={`h-4 w-4 ${isCommercial ? 'text-[#00F894]' : 'text-indexa-purple'}`} />
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
