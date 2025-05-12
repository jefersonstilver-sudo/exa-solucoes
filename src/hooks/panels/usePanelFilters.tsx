
import { useState } from 'react';
import { FilterOptions } from '@/types/filter';

interface UsePanelFiltersReturn {
  filters: FilterOptions;
  handleFilterChange: (newFilters: Partial<FilterOptions>) => void;
}

export const usePanelFilters = (): UsePanelFiltersReturn => {
  const [filters, setFilters] = useState<FilterOptions>({
    radius: 5000, // 5km default
    neighborhood: 'all',
    status: ['online'],
    buildingProfile: [],
    facilities: [],
    minMonthlyViews: 0,
    locationType: ['residential', 'commercial'] // Default to both
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({...prev, ...newFilters}));
  };

  return {
    filters,
    handleFilterChange
  };
};
