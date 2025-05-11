
import React from 'react';
import { Slider } from '@/components/ui/slider';

interface MonthlyViewsFilterProps {
  value: number;
  onChange: (value: number) => void;
}

const MonthlyViewsFilter: React.FC<MonthlyViewsFilterProps> = ({ value, onChange }) => {
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold">
          {value > 0 
            ? `${value.toLocaleString('pt-BR')}+` 
            : 'Qualquer'}
        </span>
      </div>
      <Slider
        defaultValue={[0]}
        max={10000}
        step={500}
        value={[value]}
        onValueChange={(values) => {
          onChange(values[0]);
        }}
        className="[&>span]:bg-[#7C3AED]"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">0</span>
        <span className="text-xs text-muted-foreground">10.000+</span>
      </div>
    </div>
  );
};

export default MonthlyViewsFilter;
