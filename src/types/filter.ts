
export interface FilterOptions {
  radius: number;
  neighborhood: string;
  status: string[];
  buildingProfile: string[];
  facilities: string[];
  minMonthlyViews: number;
  buildingAge?: 'all' | 'new' | 'medium' | 'old';
  buildingType?: 'all' | 'residential' | 'commercial' | 'shopping';
}
