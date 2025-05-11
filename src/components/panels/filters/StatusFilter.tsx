
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface StatusFilterProps {
  selectedStatuses: string[];
  onChange: (status: string, checked: boolean) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatuses, onChange }) => {
  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center">
        <Checkbox 
          id="status-online"
          checked={selectedStatuses.includes('online')}
          onCheckedChange={(checked) => 
            onChange('online', checked as boolean)
          }
          className="border-[#7C3AED] data-[state=checked]:bg-[#7C3AED]"
        />
        <label 
          htmlFor="status-online"
          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Ativos
        </label>
      </div>
      <div className="flex items-center">
        <Checkbox 
          id="status-installing"
          checked={selectedStatuses.includes('installing')}
          onCheckedChange={(checked) => 
            onChange('installing', checked as boolean)
          }
          className="border-[#7C3AED] data-[state=checked]:bg-[#7C3AED]"
        />
        <label 
          htmlFor="status-installing"
          className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Em instalação
        </label>
      </div>
    </div>
  );
};

export default StatusFilter;
