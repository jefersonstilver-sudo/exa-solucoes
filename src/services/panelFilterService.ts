import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';

/**
 * Filter panels by location using Haversine formula
 */
export const filterPanelsByLocation = (
  panels: Panel[], 
  selectedLocation: {lat: number, lng: number} | null,
  radius: number
): Panel[] => {
  if (!selectedLocation) return panels;
  
  return panels.map(panel => {
    if (panel.buildings?.latitude && panel.buildings?.longitude) {
      const R = 6371e3; // metres
      const φ1 = selectedLocation.lat * Math.PI/180;
      const φ2 = panel.buildings.latitude * Math.PI/180;
      const Δφ = (panel.buildings.latitude - selectedLocation.lat) * Math.PI/180;
      const Δλ = (panel.buildings.longitude - selectedLocation.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const distance = R * c; // in metres
      
      return { ...panel, distance };
    }
    return panel;
  }).filter(panel => (panel as any).distance <= radius);
};

/**
 * Filter panels by status
 */
export const filterPanelsByStatus = (panels: Panel[], statusFilters: string[]): Panel[] => {
  if (!statusFilters.length) return panels;
  
  return panels.filter(panel => 
    statusFilters.includes(panel.status === 'installing' ? 'installing' : 'online')
  );
};

/**
 * Filter panels by neighborhood
 */
export const filterPanelsByNeighborhood = (panels: Panel[], neighborhood: string): Panel[] => {
  if (!neighborhood || neighborhood === 'all') return panels;
  
  return panels.filter(panel => 
    panel.buildings?.bairro === neighborhood
  );
};

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
    filteredPanels = filterPanelsByLocation(filteredPanels, selectedLocation, filters.radius);
  }
  
  return filteredPanels;
};