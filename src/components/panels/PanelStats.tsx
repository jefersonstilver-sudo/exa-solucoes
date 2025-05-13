
import React from 'react';
import { Eye, Users, Monitor, Tv } from 'lucide-react';

interface PanelStatsProps {
  monthlyViews: number;
  estimatedResidents: number;
  screenCount: number;
  resolution: string;
  mode: string;
}

export const PanelStats: React.FC<PanelStatsProps> = ({
  monthlyViews,
  estimatedResidents,
  screenCount,
  resolution,
  mode
}) => {
  // Format number with dots as thousands separator
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col hover:shadow-sm transition-shadow">
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Eye className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span className="text-xs">Exibições em um mês</span>
        </div>
        <div className="text-lg font-bold text-gray-800">
          {formatNumber(monthlyViews)}
        </div>
        <div className="text-[10px] text-green-600 mt-1">
          +{Math.floor(Math.random() * 15) + 5}% vs. mês anterior
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col hover:shadow-sm transition-shadow">
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Users className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span className="text-xs">Residentes impactados</span>
        </div>
        <div className="text-lg font-bold text-gray-800">
          {formatNumber(estimatedResidents)}
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          Estimativa baseada em dados censitários
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col hover:shadow-sm transition-shadow">
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Monitor className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span className="text-xs">Especificações</span>
        </div>
        <div className="text-sm font-medium text-gray-800">
          {screenCount === 1 ? '1 tela' : `${screenCount} telas`}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {resolution} • {mode === 'indoor' ? 'Interno' : 'Externo'}
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col hover:shadow-sm transition-shadow">
        <div className="flex items-center text-sm text-gray-500 mb-1">
          <Tv className="h-3.5 w-3.5 mr-1.5 text-indexa-purple" />
          <span className="text-xs">Performance</span>
        </div>
        <div className="flex items-center text-sm font-medium text-gray-800 mt-1">
          <div className="flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`text-lg ${i < 4 ? 'text-yellow-500' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.floor(Math.random() * 30) + 70}% de visibilidade média
        </div>
      </div>
    </div>
  );
};
