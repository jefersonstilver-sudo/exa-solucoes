import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { getMockPanels } from '@/services/mockPanelService';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { applyAllFilters } from '@/services/panelFilterService';
import { ensureArray } from '@/utils/supabaseUtils';

interface PanelStoreOptions {
  initialCoordinates?: { lat: number; lng: number };
  defaultRadius?: number;
}

interface UsePanelStoreReturn {
  panels: Panel[] | undefined;
  loading: boolean;
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
  fetchPanelsNearby: (lat: number, lng: number, radius?: number) => Promise<Panel[]>;
}

export const usePanelStore = ({ 
  initialCoordinates = { lat: -23.5505, lng: -46.6333 }, // São Paulo default
  defaultRadius = 5000 
}: PanelStoreOptions = {}) => {
  // Use the location search hook
  const {
    searchLocation,
    setSearchLocation,
    isSearching,
    selectedLocation,
    setSelectedLocation,
    handleSearch: handleSearchLocation,
    handleClearLocation
  } = useLocationSearch();

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    radius: 5000, // 5km default
    neighborhood: 'all',
    status: ['online'],
    buildingProfile: [],
    facilities: [],
    minMonthlyViews: 0,
    buildingAge: 'all',
    buildingType: 'all'
  });
  
  // Fetch panels based on filters
  const { data: panels, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use the mock panels
        console.log("Using mock data instead of actual API calls");
        
        // Get base mock data
        let basePanels = getMockPanels();
        
        // Apply all filters
        const filteredPanels = applyAllFilters(
          basePanels,
          filters,
          selectedLocation
        );
        
        // In production, we would use the Supabase RPC function
        if (process.env.NODE_ENV === 'production' && selectedLocation) {
          try {
            const result = await supabase.rpc('get_panels_by_location', {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              radius_meters: filters.radius
            });
            
            if (result.error) {
              throw result.error;
            }

            // Map the API response to match our Panel type
            return (result.data || []).map(panel => {
              // Ensure status is one of the allowed values
              let validStatus: 'online' | 'offline' | 'maintenance' | 'installing' = 'offline';
              if (panel.status === 'online') validStatus = 'online';
              else if (panel.status === 'maintenance') validStatus = 'maintenance';
              else if (panel.status === 'installing') validStatus = 'installing';
              
              // Convert the buildings JSON to our BuildingType
              const buildings = panel.buildings as any;
              
              return {
                ...panel,
                status: validStatus,
                buildings: buildings
              } as Panel;
            });
          } catch (error) {
            console.error("Error fetching panels from API:", error);
            // Return mock data as fallback
          }
        }
        
        return filteredPanels;
      } catch (err) {
        console.error('Error fetching panels:', err);
        return [] as Panel[];
      }
    },
    enabled: true
  });

  const fetchPanelsNearby = useCallback(async (lat: number, lng: number, radius: number = defaultRadius) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the database function to get panels by location
      const { data, error } = await supabase
        .rpc('get_panels_by_location', { 
          lat, 
          lng, 
          radius_meters: radius 
        });
      
      if (error) throw error;
      
      // Ensure data is an array
      const panelsArray = ensureArray(data);
      
      // Map to the expected format
      const panelsData = panelsArray.map(item => ({
        id: item.id,
        code: item.code,
        building_id: item.building_id,
        status: item.status,
        ultima_sync: item.ultima_sync,
        resolucao: item.resolucao,
        modo: item.modo,
        buildings: item.buildings
      }));
      
      setPanels(panelsData);
      
      return panelsData;
    } catch (error: any) {
      console.error('Error fetching panels:', error);
      setError(error.message || 'Error fetching panels');
      return [];
    } finally {
      setLoading(false);
    }
  }, [defaultRadius]);

  // Adapted handleSearch to use our location hook
  const handleSearch = async (location: string) => {
    const coordinates = await handleSearchLocation(location);
    if (coordinates) {
      await refetch();
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({...prev, ...newFilters}));
  };

  return {
    panels,
    loading,
    error,
    fetchPanelsNearby,
    searchLocation,
    setSearchLocation,
    selectedLocation,
    setSelectedLocation,
    isSearching,
    filters,
    handleFilterChange,
    handleSearch,
    handleClearLocation
  };
};
