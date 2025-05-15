
import React from 'react';
import { Button } from '@/components/ui/button';
import NavigationLogDisplay from './NavigationLogDisplay';

interface NavigationTabProps {
  navigationLogs: any[];
  healthStatus: any;
  onResetNavigation: () => void;
}

const NavigationTab: React.FC<NavigationTabProps> = ({ 
  navigationLogs, 
  healthStatus, 
  onResetNavigation
}) => {
  return (
    <div className="p-4 mt-2 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Logs of Navigation</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            healthStatus.status === 'issues' ? 'bg-red-100 text-red-700' : 
            healthStatus.status === 'reset' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {healthStatus.status === 'issues' ? 'With issues' : 
             healthStatus.status === 'reset' ? 'Reset' : 'Healthy'}
          </span>
          <Button 
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={onResetNavigation}
          >
            Reset
          </Button>
        </div>
      </div>
      
      <NavigationLogDisplay logs={navigationLogs} />
    </div>
  );
};

export default NavigationTab;
