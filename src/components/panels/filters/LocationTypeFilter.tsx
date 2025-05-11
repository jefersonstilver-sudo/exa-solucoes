
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { locationTypeOptions } from './filterOptions';

interface LocationTypeFilterProps {
  selectedTypes: string[];
  onChange: (locationType: string, checked: boolean) => void;
}

const LocationTypeFilter: React.FC<LocationTypeFilterProps> = ({ selectedTypes, onChange }) => {
  return (
    <div className="space-y-2 mt-2">
      {locationTypeOptions.map(option => (
        <div key={option.id} className="flex items-center">
          <Checkbox 
            id={`location-${option.id}`}
            checked={selectedTypes.includes(option.id)}
            onCheckedChange={(checked) => 
              onChange(option.id, checked as boolean)
            }
            className="border-[#7C3AED] data-[state=checked]:bg-[#7C3AED]"
          />
          <label 
            htmlFor={`location-${option.id}`}
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {option.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default LocationTypeFilter;
