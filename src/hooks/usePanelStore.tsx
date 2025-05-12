
import { useQuery } from '@tanstack/react-query';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { usePanelSearch } from './panels/usePanelSearch';
import { usePanelFilters } from './panels/usePanelFilters';
import { fetchPanels } from '@/services/panelService';

interface UsePanelStoreReturn {
  panels: Panel[] | undefined;
  isLoading: boolean;
  error: unknown;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: {lat: number, lng: number} | null;
  setSelectedLocation: (location: {lat: number, lng: number} | null) => void;
  isSearching: boolean;
  filters: FilterOptions;
  handleFilterChange: (newFilters: Partial<FilterOptions>) => void;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
}

export const usePanelStore = (): UsePanelStoreReturn => {
  // Use our custom hooks for filters
  const { filters, handleFilterChange } = usePanelFilters();
  
  // Get search functionality and state
  const searchHook = usePanelSearch(() => refetch());
  const { selectedLocation } = searchHook;
  
  // Set up the panels data query
  const { 
    data: panels, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: () => fetchPanels(filters, selectedLocation),
    enabled: true
  });

  return {
    panels,
    isLoading,
    error,
    ...searchHook,
    filters,
    handleFilterChange
  };
};
