
import React, { useState } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterOptions } from '@/types/filter';

interface SearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation?: () => void;
  filters: FilterOptions;
  handleFilterChange: (filters: Partial<FilterOptions>) => void;
  panelsCount: number;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  filters,
  handleFilterChange,
  panelsCount
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-indexa-purple mb-4">
          Encontre Painéis Digitais
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1 text-gray-500">Digite o bairro ou localização desejada</label>
            <div className="relative">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none"
                placeholder="Bairro, endereço ou ponto de referência"
                disabled={isSearching}
              />
              {searchLocation && (
                <button
                  onClick={() => setSearchLocation('')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSearch(searchLocation)}
                disabled={isSearching || !searchLocation}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-indexa-purple p-1 rounded-md hover:bg-indexa-purple-dark disabled:bg-gray-300"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-500">Data de início</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-gray-500">Período</label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none"
              defaultValue="30"
            >
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>
        </div>
        
        {selectedLocation && (
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-1 text-indexa-purple" />
              <span className="text-indexa-purple">{searchLocation}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">
                {panelsCount} resultados no raio de {filters.radius / 1000} km
              </span>
              <select 
                className="px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-indexa-purple"
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
        )}
      </div>
    </div>
  );
};

export default SearchSection;
