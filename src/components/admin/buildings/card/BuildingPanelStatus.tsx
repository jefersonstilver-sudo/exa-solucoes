
import React from 'react';
import { Monitor, Wifi, WifiOff, Settings as SettingsIcon } from 'lucide-react';

interface BuildingPanelStatusProps {
  panelStats: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
}

const BuildingPanelStatus: React.FC<BuildingPanelStatusProps> = ({ panelStats }) => {
  if (panelStats.total === 0) return null;

  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
      <div className="flex items-center space-x-1 mb-2">
        <Monitor className="h-4 w-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Status dos Painéis</span>
      </div>
      <div className="flex items-center space-x-4 text-xs">
        {panelStats.online > 0 && (
          <div className="flex items-center space-x-1">
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-green-600 font-medium">{panelStats.online} Online</span>
          </div>
        )}
        {panelStats.offline > 0 && (
          <div className="flex items-center space-x-1">
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-600 font-medium">{panelStats.offline} Offline</span>
          </div>
        )}
        {panelStats.maintenance > 0 && (
          <div className="flex items-center space-x-1">
            <SettingsIcon className="h-3 w-3 text-yellow-500" />
            <span className="text-yellow-600 font-medium">{panelStats.maintenance} Manutenção</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingPanelStatus;
