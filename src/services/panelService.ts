
import { supabase } from '@/integrations/supabase/client';
import { Panel, Building } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { 
  getMockPanels, 
  filterPanelsByLocation, 
  filterPanelsByStatus, 
  filterPanelsByNeighborhood 
} from '@/services/mockPanelService';

export const fetchPanels = async (
  filters: FilterOptions,
  selectedLocation: { lat: number, lng: number } | null
): Promise<Panel[]> => {
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
        filteredData = filteredData.filter(panel => {
          // Safely access location_type on buildings object
          const buildings = panel.buildings as any;
          const locationType = buildings?.location_type || 'residential';
          
          return filters.locationType.includes(locationType);
        });
      }
      
      return filteredData.map(panel => {
        // Ensure status is one of the allowed values
        let validStatus: 'online' | 'offline' | 'maintenance' | 'installing' = 'offline';
        if (panel.status === 'online') validStatus = 'online';
        else if (panel.status === 'maintenance') validStatus = 'maintenance';
        else if (panel.status === 'installing') validStatus = 'installing';
        
        // Cast buildings to Building type for TypeScript
        const buildings = panel.buildings as unknown as Building;
        
        return {
          ...panel,
          status: validStatus,
          buildings
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
          buildings: panel.buildings as Building
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
};
