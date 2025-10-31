
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface BuildingSearchSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const BuildingSearchSection: React.FC<BuildingSearchSectionProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2 text-[#9C1E1E]" />
          Buscar Prédios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Buscar por nome, endereço ou bairro..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
      </CardContent>
    </Card>
  );
};

export default BuildingSearchSection;
