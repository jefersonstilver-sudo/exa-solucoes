
import React from 'react';
import { radiusOptions } from './filterOptions';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RadiusFilterProps {
  selectedRadius: number;
  onChange: (radius: number) => void;
}

const RadiusFilter: React.FC<RadiusFilterProps> = ({ selectedRadius, onChange }) => {
  return (
    <Select 
      value={selectedRadius.toString()} 
      onValueChange={(value) => onChange(parseInt(value))}
    >
      <SelectTrigger className="w-full mt-2">
        <SelectValue placeholder="Selecionar raio" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Distância</SelectLabel>
          {radiusOptions.map(option => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default RadiusFilter;
