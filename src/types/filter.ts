
export interface FilterOptions {
  radius: number;
  neighborhood: string;
  status: string[];
  buildingProfile: string[];
  facilities: string[];
  minMonthlyViews: number;
  locationType: string[]; // New field for location type filter
}
