
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { FilterOptions } from '@/types/filter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

// Import filter section components
import FilterSection from './filters/FilterSection';
import SearchForm from './filters/SearchForm';
import LocationTypeFilter from './filters/LocationTypeFilter';
import RadiusFilter from './filters/RadiusFilter';
import NeighborhoodFilter from './filters/NeighborhoodFilter';
import StatusFilter from './filters/StatusFilter';
import BuildingProfileFilter from './filters/BuildingProfileFilter';
import FacilitiesFilter from './filters/FacilitiesFilter';
import MonthlyViewsFilter from './filters/MonthlyViewsFilter';

interface PanelFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onSearch: (location: string) => void;
  loading: boolean;
}

const PanelFilters: React.FC<PanelFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  onSearch,
  loading
}) => {
  const [expandedSections, setExpandedSections] = useState({
    radius: true,
    neighborhood: true,
    status: true,
    locationType: true,
    buildingProfile: false,
    facilities: false,
    views: false
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };
  
  const handleLocationTypeChange = (locationType: string, checked: boolean) => {
    const newLocationTypes = checked 
      ? [...filters.locationType, locationType]
      : filters.locationType.filter(lt => lt !== locationType);
      
    onFilterChange({ locationType: newLocationTypes });
  };
  
  const handleFacilityChange = (facilityId: string, checked: boolean) => {
    const newFacilities = checked 
      ? [...filters.facilities, facilityId]
      : filters.facilities.filter(f => f !== facilityId);
      
    onFilterChange({ facilities: newFacilities });
  };
  
  const handleProfileChange = (profileId: string, checked: boolean) => {
    const newProfiles = checked 
      ? [...filters.buildingProfile, profileId]
      : filters.buildingProfile.filter(p => p !== profileId);
      
    onFilterChange({ buildingProfile: newProfiles });
  };
  
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked 
      ? [...filters.status, status]
      : filters.status.filter(s => s !== status);
      
    onFilterChange({ status: newStatus });
  };
  
  const resetFilters = () => {
    onFilterChange({
      radius: 5000,
      neighborhood: 'all',
      status: ['online'],
      buildingProfile: [],
      facilities: [],
      minMonthlyViews: 0,
      locationType: ['residential', 'commercial']
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg border shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center text-[#7C3AED]">
          <Filter className="mr-2 h-5 w-5" /> Filtros
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters}
          className="text-sm text-muted-foreground hover:text-[#00F894]"
        >
          Limpar
        </Button>
      </div>
      
      {/* Search form */}
      <SearchForm onSearch={onSearch} loading={loading} />
      
      <Separator className="my-4" />
      
      {/* Location Type filter */}
      <FilterSection 
        title="Tipo de Local"
        isExpanded={expandedSections.locationType}
        onToggleExpand={() => toggleSection('locationType')}
      >
        <LocationTypeFilter
          selectedTypes={filters.locationType}
          onChange={handleLocationTypeChange}
        />
      </FilterSection>
      
      {/* Radius filter */}
      <FilterSection 
        title="Raio de busca"
        isExpanded={expandedSections.radius}
        onToggleExpand={() => toggleSection('radius')}
      >
        <RadiusFilter
          selectedRadius={filters.radius}
          onChange={(radius) => onFilterChange({ radius })}
        />
      </FilterSection>
      
      {/* Neighborhood filter */}
      <FilterSection 
        title="Bairro"
        isExpanded={expandedSections.neighborhood}
        onToggleExpand={() => toggleSection('neighborhood')}
      >
        <NeighborhoodFilter
          selectedNeighborhood={filters.neighborhood}
          onChange={(neighborhood) => onFilterChange({ neighborhood })}
        />
      </FilterSection>
      
      {/* Status filter */}
      <FilterSection 
        title="Status do painel"
        isExpanded={expandedSections.status}
        onToggleExpand={() => toggleSection('status')}
      >
        <StatusFilter
          selectedStatuses={filters.status}
          onChange={handleStatusChange}
        />
      </FilterSection>
      
      <Separator className="my-4" />
      
      {/* Building profile filter */}
      <FilterSection 
        title="Perfil do prédio"
        isExpanded={expandedSections.buildingProfile}
        onToggleExpand={() => toggleSection('buildingProfile')}
      >
        <BuildingProfileFilter
          selectedProfiles={filters.buildingProfile}
          onChange={handleProfileChange}
        />
      </FilterSection>
      
      {/* Facilities filter */}
      <FilterSection 
        title="Comodidades"
        isExpanded={expandedSections.facilities}
        onToggleExpand={() => toggleSection('facilities')}
      >
        <FacilitiesFilter
          selectedFacilities={filters.facilities}
          onChange={handleFacilityChange}
        />
      </FilterSection>
      
      {/* Monthly views filter */}
      <FilterSection 
        title="Visualizações mensais mínimas"
        isExpanded={expandedSections.views}
        onToggleExpand={() => toggleSection('views')}
      >
        <MonthlyViewsFilter
          value={filters.minMonthlyViews}
          onChange={(value) => onFilterChange({ minMonthlyViews: value })}
        />
      </FilterSection>
      
      <Button 
        onClick={resetFilters}
        variant="outline"
        className="w-full mt-4 hover:border-[#00F894] hover:text-[#00F894] transition-all"
      >
        <X className="mr-2 h-4 w-4" />
        Limpar Filtros
      </Button>
    </motion.div>
  );
};

export default PanelFilters;
