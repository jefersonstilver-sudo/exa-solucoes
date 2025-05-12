
import React, { useState } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterOptions } from '@/types/filter';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-enhanced hover:shadow-enhanced-hover transition-all duration-300 mb-8 border border-gray-200"
    >
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-indexa-purple mb-6">
          Encontre Painéis Digitais
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm mb-2 text-gray-700 font-medium">Digite o bairro ou localização desejada</label>
            <div className="relative">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none shadow-sm transition-all duration-200"
                placeholder="Bairro, endereço ou ponto de referência"
                disabled={isSearching}
              />
              {searchLocation && (
                <button
                  onClick={() => setSearchLocation('')}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleSearch(searchLocation)}
                disabled={isSearching || !searchLocation}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white bg-indexa-purple p-1.5 rounded-md hover:bg-indexa-purple-dark disabled:bg-gray-300 transition-all duration-200"
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
            <label className="block text-sm mb-2 text-gray-700 font-medium">Data de início</label>
            <input
              type="date"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none shadow-sm transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-gray-700 font-medium">Período</label>
            <select
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none shadow-sm transition-all duration-200"
              defaultValue="30"
            >
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </div>
        </div>
        
        {selectedLocation && (
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
        )}
      </div>
    </motion.div>
  );
};

export default SearchSection;
