
import React from 'react';
import { Button } from '@/components/ui/button';

interface SystemActionsProps {
  onResetNavigation: () => void;
  onClearLogs: () => void;
}

const SystemActions: React.FC<SystemActionsProps> = ({ onResetNavigation, onClearLogs }) => {
  return (
    <div className="pt-2 space-y-2">
      <Button 
        variant="outline" 
        size="sm"
        className="w-full"
        onClick={onResetNavigation}
      >
        Reset Navigation State
      </Button>
      
      <Button 
        variant="outline" 
        size="sm"
        className="w-full"
        onClick={onClearLogs}
      >
        Clear all logs
      </Button>
    </div>
  );
};

export default SystemActions;
