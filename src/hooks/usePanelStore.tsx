
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
    locationType: ['residential', 'commercial'] // Default to both
  });
  
  // Fetch panels based on filters
  const { data: panels, isLoading, error, refetch } = useQuery({
    queryKey: ['panels', filters, selectedLocation],
    queryFn: async () => {
      try {
        console.log("Fetching panels with filters:", filters);
        
        // In a real application, we would use the Supabase RPC function with the updated filters
        if (selectedLocation && process.env.NODE_ENV === 'production') {
          // Real implementation using Supabase
          const { data, error } = await supabase.rpc('get_panels_by_location', {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            radius_meters: filters.radius
          });
          
          if (error) throw error;
          
          // Filter by location type if specified
          let filteredData = data || [];
          if (filters.locationType.length > 0 && filters.locationType.length < 2) {
            filteredData = filteredData.filter(panel => 
              filters.locationType.includes(panel.buildings?.location_type || 'residential')
            );
          }
          
          return filteredData.map(panel => {
            // Ensure status is one of the allowed values
            let validStatus: 'online' | 'offline' | 'maintenance' | 'installing' = 'offline';
            if (panel.status === 'online') validStatus = 'online';
            else if (panel.status === 'maintenance') validStatus = 'maintenance';
            else if (panel.status === 'installing') validStatus = 'installing';
            
            return {
              ...panel,
              status: validStatus,
              buildings: panel.buildings
            } as Panel;
          });
        }
        
        // For development or mock data
        // Get base mock data or live data from Supabase
        let filteredPanels = [];
        
        try {
          // Try to get real data from Supabase
          const { data, error } = await supabase
            .from('painels')
            .select(`
              *,
              buildings!inner (*)
            `)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            console.log("Got real panels from Supabase:", data.length);
            filteredPanels = data.map(panel => ({
              ...panel,
              buildings: panel.buildings
            }));
          } else {
            // Fallback to mock data
            console.log("Using mock data");
            filteredPanels = getMockPanels();
          }
        } catch (err) {
          console.error("Error fetching from Supabase, using mock data:", err);
          filteredPanels = getMockPanels();
        }
        
        // Filter by status
        if (filters.status.length > 0) {
          filteredPanels = filteredPanels.filter(panel => 
            filters.status.includes(panel.status)
          );
        }
        
        // Filter by neighborhood if not set to "all"
        if (filters.neighborhood !== 'all') {
          filteredPanels = filteredPanels.filter(panel => 
            panel.buildings?.bairro === filters.neighborhood
          );
        }
        
        // Filter by location type
        if (filters.locationType.length > 0 && filters.locationType.length < 2) {
          filteredPanels = filteredPanels.filter(panel => 
            filters.locationType.includes(panel.buildings?.location_type || 'residential')
          );
        }
        
        // If we have a selected location, filter by distance
        if (selectedLocation) {
          console.log(`Filtering panels near selected location: ${selectedLocation.lat}, ${selectedLocation.lng}`);
          filteredPanels = filterPanelsByLocation(filteredPanels, selectedLocation, filters.radius);
        }
        
        console.log(`Returning ${filteredPanels.length} filtered panels`);
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
