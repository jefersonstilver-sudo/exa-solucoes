
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { useToast } from '@/hooks/use-toast';
import { 
  getMockPanels, 
  filterPanelsByLocation, 
  filterPanelsByStatus, 
  filterPanelsByNeighborhood 
} from '@/services/mockPanelService';
import { getLocationCoordinates } from '@/services/geocoding';

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
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    radius: 5000, // 5km default
    neighborhood: 'all',
    status: ['online'],
    buildingProfile: [],
    facilities: [],
    minMonthlyViews: 0,
    buildingAge: 'all', // ALASKA: Added building age filter
    buildingType: 'all' // ALASKA: Added building type filter
  });
  
  // Fetch panels based on filters
  const { data: panels, isLoading, error, refetch } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use the mock panels
        console.log("Using mock data instead of actual API calls");
        
        // Get base mock data
        let filteredPanels = getMockPanels();
        
        // Filter by status
        filteredPanels = filterPanelsByStatus(filteredPanels, filters.status);
        
        // Filter by neighborhood
        filteredPanels = filterPanelsByNeighborhood(filteredPanels, filters.neighborhood);
        
        // ALASKA: Filter by building type if specified
        if (filters.buildingType !== 'all') {
          filteredPanels = filteredPanels.filter(panel => {
            if (filters.buildingType === 'residential') {
              return panel.buildings?.condominiumProfile === 'residential';
            } else if (filters.buildingType === 'commercial') {
              return panel.buildings?.condominiumProfile === 'commercial';
            }
            return true;
          });
        }
        
        // If we have a selected location, simulate proximity filtering
        if (selectedLocation) {
          console.log(`Filtering panels near selected location: ${selectedLocation.lat}, ${selectedLocation.lng}`);
          
          try {
            // In a real application, we would use the Supabase RPC function
            // For now, let's simulate the distance calculation
            if (process.env.NODE_ENV === 'production') {
              // This would be the real implementation using Supabase
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
            }
          } catch (error) {
            console.error("Error fetching panels from API:", error);
            // Fall back to mock data with distance calculation
          }
          
          // Filter by location/distance and add distance property to panels
          filteredPanels = filterPanelsByLocation(filteredPanels, selectedLocation, filters.radius)
            .map(panel => {
              // Calculate a realistic distance based on the latitude/longitude
              // This is a simplified version for mock purposes
              if (panel.buildings && panel.buildings.latitude && panel.buildings.longitude) {
                const lat1 = selectedLocation.lat;
                const lon1 = selectedLocation.lng;
                const lat2 = panel.buildings.latitude;
                const lon2 = panel.buildings.longitude;
                
                // Haversine formula to calculate distance between two points
                const R = 6371e3; // metres
                const φ1 = lat1 * Math.PI/180;
                const φ2 = lat2 * Math.PI/180;
                const Δφ = (lat2-lat1) * Math.PI/180;
                const Δλ = (lon2-lon1) * Math.PI/180;

                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                          Math.cos(φ1) * Math.cos(φ2) *
                          Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

                const distance = R * c; // in metres
                
                return {
                  ...panel,
                  distance: distance
                };
              }
              return panel;
            });
        }
        
        return filteredPanels;
      } catch (err) {
        console.error('Error fetching panels:', err);
        return [] as Panel[];
      }
    },
    enabled: true
  });

  const handleSearch = async (location: string) => {
    if (!location.trim()) {
      toast({
        variant: "destructive",
        title: "Localização vazia",
        description: "Por favor, digite um endereço ou bairro para buscar.",
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      console.log('Searching for location:', location);
      
      // Get coordinates from address using our geocoding service
      const coordinates = await getLocationCoordinates(location);
      
      if (!coordinates) {
        toast({
          variant: "destructive",
          title: "Localização não encontrada",
          description: `Não foi possível encontrar "${location}". Tente um endereço mais específico.`,
        });
        setIsSearching(false);
        return;
      }
      
      console.log('Found coordinates:', coordinates);
      
      // Update selected location and search text
      setSelectedLocation(coordinates);
      setSearchLocation(location);
      
      // Refresh data query with new coordinates
      await refetch();
      
      toast({
        title: "Localização encontrada",
        description: `Mostrando resultados próximos a "${location}"`,
      });
    } catch (error) {
      console.error("Erro ao buscar localização:", error);
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: "Não foi possível encontrar esta localização. Tente novamente.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({...prev, ...newFilters}));
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchLocation('');
    toast({
      title: "Busca limpa",
      description: "Mostrando todos os painéis disponíveis",
    });
  };

  return {
    panels,
    isLoading,
    error,
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
