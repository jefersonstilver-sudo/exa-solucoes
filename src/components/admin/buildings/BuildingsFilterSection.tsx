
import React from 'react';
import BuildingFilters from './BuildingFilters';
import BuildingSearchSection from './BuildingSearchSection';

interface BuildingsFilterSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    status: string;
    bairro: string;
    padrao_publico: string;
  };
  onFiltersChange: (filters: any) => void;
  buildings: any[];
}

const BuildingsFilterSection: React.FC<BuildingsFilterSectionProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  buildings
}) => {
  return (
    <>
      <BuildingFilters 
        filters={filters} 
        onFiltersChange={onFiltersChange}
        buildings={buildings}
      />

      <BuildingSearchSection
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />
    </>
  );
};

export default BuildingsFilterSection;
