import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { Building } from '@/types/building';
import { useToast } from '@/hooks/use-toast';
import { getPanelBasePrice } from '@/utils/priceUtils';

interface FilterState {
  location: {
    enabled: boolean;
    radius: number;
  };
  price: {
    min: number | null;
    max: number | null;
  };
  status: {
    active: boolean;
    inactive: boolean;
  };
}

interface PanelDisplayInfo {
  id: string;
  title: string;
  address: string;
  district: string;
  imageUrl: string;
  status: string;
  resolution: string;
  mode: string;
  lastSync: Date | null;
  priceBase: number;
}

interface SearchLocation {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const defaultFilters: FilterState = {
  location: {
    enabled: false,
    radius: 5000,
  },
  price: {
    min: null,
    max: null,
  },
  status: {
    active: true,
    inactive: false,
  },
};

export const usePanelStore = () => {
  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [searchLocation, setSearchLocation] = useState<SearchLocation | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch initial panels
  useEffect(() => {
    fetchAllPanels();
  }, []);
  
  // Reset panels when filters change
  useEffect(() => {
    if (panels) {
      setPanels(prevPanels => prevPanels?.map(panel => ({ ...panel, visible: true })));
    }
  }, [filters]);
  
  // Geocoding function
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&apiKey=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const { lat, lon } = data.features[0].properties;
        return { lat, lng: lon };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Erro ao geocodificar endereço:", error);
      return null;
    }
  };
  
  // Fetch panels near a location
  const fetchPanelsNearLocation = async (latitude: number, longitude: number, radius: number): Promise<Panel[]> => {
    setIsLoading(true);
    
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    const sql = `
      SELECT
        p.*
      FROM
        painel p
      JOIN
        buildings b ON p.building_id = b.id
      WHERE
        ST_DWithin(
          ST_MakePoint(b.longitude, b.latitude)::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius}
        );
    `;
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/nearby_panels`, {
        method: 'POST',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          latitude,
          longitude,
          radius
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data as Panel[];
    } catch (error) {
      console.error("Erro ao buscar painéis próximos:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch all panels
  const fetchAllPanels = async (): Promise<void> => {
    setIsLoading(true);
    setEmptyReason(null);
    
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/painel?select=*`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        setPanels(data as Panel[]);
      } else {
        setEmptyReason('all');
        setPanels([]);
      }
    } catch (error) {
      console.error("Erro ao buscar todos os painéis:", error);
      toast({
        title: "Erro ao carregar painéis",
        description: "Houve um erro ao carregar os painéis. Tente novamente mais tarde.",
        variant: "destructive",
      });
      setPanels(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search by location
  const searchByLocation = async (location: string): Promise<void> => {
    if (!location.trim()) return;
    
    setIsSearching(true);
    
    try {
      // Get coordinates for the location
      const coordinates = await geocodeAddress(location);
      
      if (coordinates) {
        // Fetch buildings/panels near the coordinates
        const nearbyPanels = await fetchPanelsNearLocation(
          coordinates.lat,
          coordinates.lng,
          5000 // 5km radius
        );
        
        if (nearbyPanels && nearbyPanels.length > 0) {
          setPanels(nearbyPanels);
          
          // Update search location for display
          setSearchLocation({
            address: location,
            coordinates
          });
          
          // Update filter to show we're filtering by location
          setFilters(prev => ({
            ...prev,
            location: {
              ...prev.location,
              enabled: true,
              radius: 5000
            }
          }));
        } else {
          // No panels found at this location
          setEmptyReason('location');
          setPanels([]);
        }
      } else {
        // Location not found
        toast({
          title: "Localização não encontrada",
          description: "Não conseguimos encontrar essa localização. Tente outra ou use os filtros disponíveis.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar por localização:", error);
      toast({
        title: "Erro na busca",
        description: "Houve um erro ao buscar painéis nessa localização.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  };
  
  // Get panel display information
  const getPanelDisplayInfo = (panel: Panel): PanelDisplayInfo => {
    const building = panel.buildings;
    const buildingName = building ? (building.nome || 'Edifício') : 'Edifício';
    const buildingAddress = building ? (building.endereco || 'Endereço não disponível') : 'Endereço não disponível';
    const buildingDistrict = building?.bairro || '';
    const buildingImageUrl = building?.imageUrl || 'https://via.placeholder.com/400x300?text=Sem+Imagem';
    
    return {
      id: panel.id,
      title: buildingName,
      address: buildingAddress,
      district: buildingDistrict,
      imageUrl: buildingImageUrl,
      status: panel.status,
      resolution: panel.resolucao || '4K',
      mode: panel.modo || 'Interno',
      lastSync: panel.ultima_sync ? new Date(panel.ultima_sync) : null,
      priceBase: getPanelBasePrice(panel),
    };
  };
  
  return {
    panels,
    isLoading,
    isSearching,
    filters,
    searchLocation,
    emptyReason,
    handleFilterChange,
    searchByLocation,
    getPanelDisplayInfo,
  };
};
