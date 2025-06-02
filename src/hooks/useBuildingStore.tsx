
// Re-export for backward compatibility
export { useBuildingStore as default, useBuildingStore } from './building-store/useBuildingStore';

export interface BuildingFilters {
  neighborhood: string;
  venueType: string[];
  priceRange: [number, number];
  audienceMin: number;
  standardProfile: string[];
  amenities: string[];
  sortBy: string;
}
