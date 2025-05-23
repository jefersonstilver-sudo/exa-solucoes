
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import { 
  filterPanelsByLocation, 
  filterPanelsByStatus, 
  filterPanelsByNeighborhood 
} from '@/services/mockPanelService';

/**
 * Apply all filters to a collection of panels
 */
export const applyAllFilters = (
  panels: Panel[],
  filters: FilterOptions,
  selectedLocation: {lat: number, lng: number} | null
): Panel[] => {
  let filteredPanels = [...panels];
  
  // Filter by status if there are any status options selected
  if (filters.status && filters.status.length > 0) {
    filteredPanels = filterPanelsByStatus(filteredPanels, filters.status);
  }
  
  // Filter by neighborhood if a specific neighborhood is selected
  if (filters.neighborhood && filters.neighborhood !== 'all') {
    filteredPanels = filterPanelsByNeighborhood(filteredPanels, filters.neighborhood);
  }
  
  // Filter by building type if specified
  if (filters.buildingType && filters.buildingType !== 'all') {
    filteredPanels = filteredPanels.filter(panel => {
      if (filters.buildingType === 'residential') {
        return panel.buildings?.condominiumProfile === 'residential';
      } else if (filters.buildingType === 'commercial') {
        return panel.buildings?.condominiumProfile === 'commercial';
      }
      return true;
    });
  }
  
  // Filter by location/distance if we have a selected location
  if (selectedLocation && typeof filters.radius === 'number') {
    filteredPanels = filterPanelsByLocation(filteredPanels, selectedLocation, filters.radius)
      .map(panel => {
        // Calculate distance using Haversine formula
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
          
          return { ...panel, distance };
        }
        return panel;
      });
  }
  
  return filteredPanels;
};
