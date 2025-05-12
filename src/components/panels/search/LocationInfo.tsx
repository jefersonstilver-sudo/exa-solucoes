
import React from 'react';
import { MapPin } from 'lucide-react';
import { FilterOptions } from '@/types/filter';

interface LocationInfoProps {
  searchLocation: string;
  selectedLocation: { lat: number; lng: number } | null;
  filters: FilterOptions;
  handleFilterChange: (filters: Partial<FilterOptions>) => void;
  panelsCount: number;
}

const LocationInfo: React.FC<LocationInfoProps> = ({
  searchLocation,
  selectedLocation,
  filters,
  handleFilterChange,
  panelsCount
}) => {
  if (!selectedLocation) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 pt-3 border-t border-gray-100">
      <div className="flex items-center text-sm mb-3 sm:mb-0">
        <MapPin className="w-5 h-5 mr-1.5 text-indexa-purple" />
        <span className="text-indexa-purple font-medium">{searchLocation}</span>
      </div>
      <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-full">
        <span className="text-sm text-gray-600 mr-2">
          {panelsCount} resultados no raio de {filters.radius / 1000} km
        </span>
        <select 
          className="px-2 py-1 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-indexa-purple bg-white shadow-sm transition-all duration-200"
          value={filters.radius}
          onChange={(e) => handleFilterChange({ radius: Number(e.target.value) })}
        >
          <option value="500">500m</option>
          <option value="1000">1km</option>
          <option value="3000">3km</option>
          <option value="5000">5km</option>
          <option value="10000">10km</option>
        </select>
      </div>
    </div>
  );
};

export default LocationInfo;
