import React from 'react';
import { cn } from '@/lib/utils';

interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  options,
  selected,
  onSelect
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onSelect(option.key)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
            selected === option.key
              ? "bg-[#9C1E1E] text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
              selected === option.key
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-500"
            )}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default FilterPills;
