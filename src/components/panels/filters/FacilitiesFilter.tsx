
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { facilityOptions } from './filterOptions';

interface FacilitiesFilterProps {
  selectedFacilities: string[];
  onChange: (facilityId: string, checked: boolean) => void;
}

const FacilitiesFilter: React.FC<FacilitiesFilterProps> = ({ selectedFacilities, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {facilityOptions.map(facility => (
        <div key={facility.id} className="flex items-center">
          <Checkbox 
            id={`facility-${facility.id}`}
            checked={selectedFacilities.includes(facility.id)}
            onCheckedChange={(checked) => 
              onChange(facility.id, checked as boolean)
            }
            className="border-[#7C3AED] data-[state=checked]:bg-[#7C3AED]"
          />
          <label 
            htmlFor={`facility-${facility.id}`}
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {facility.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default FacilitiesFilter;
