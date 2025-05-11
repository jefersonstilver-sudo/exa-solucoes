
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { profileOptions } from './filterOptions';

interface BuildingProfileFilterProps {
  selectedProfiles: string[];
  onChange: (profileId: string, checked: boolean) => void;
}

const BuildingProfileFilter: React.FC<BuildingProfileFilterProps> = ({ selectedProfiles, onChange }) => {
  return (
    <div className="space-y-2 mt-2">
      {profileOptions.map(profile => (
        <div key={profile.id} className="flex items-center">
          <Checkbox 
            id={`profile-${profile.id}`}
            checked={selectedProfiles.includes(profile.id)}
            onCheckedChange={(checked) => 
              onChange(profile.id, checked as boolean)
            }
            className="border-[#7C3AED] data-[state=checked]:bg-[#7C3AED]"
          />
          <label 
            htmlFor={`profile-${profile.id}`}
            className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {profile.label}
          </label>
        </div>
      ))}
    </div>
  );
};

export default BuildingProfileFilter;
