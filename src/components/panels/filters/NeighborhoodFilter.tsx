
import React from 'react';
import { neighborhoodOptions } from './filterOptions';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NeighborhoodFilterProps {
  selectedNeighborhood: string;
  onChange: (neighborhood: string) => void;
}

const NeighborhoodFilter: React.FC<NeighborhoodFilterProps> = ({ selectedNeighborhood, onChange }) => {
  return (
    <Select 
      value={selectedNeighborhood || "all"} 
      onValueChange={(value) => onChange(value)}
    >
      <SelectTrigger className="w-full mt-2">
        <SelectValue placeholder="Selecionar bairro" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Bairros</SelectLabel>
          <SelectItem value="all">Todos os bairros</SelectItem>
          {neighborhoodOptions.map(neighborhood => (
            <SelectItem key={neighborhood} value={neighborhood}>
              {neighborhood}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default NeighborhoodFilter;
