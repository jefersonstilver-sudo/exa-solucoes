
import React from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BuildingFilters } from '@/hooks/useBuildingStore';
import { motion } from 'framer-motion';

interface BuildingSearchSectionProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation?: () => void;
  filters: BuildingFilters;
  handleFilterChange: (filters: Partial<BuildingFilters>) => void;
  buildingsCount: number;
}

const BuildingSearchSection: React.FC<BuildingSearchSectionProps> = ({
  searchLocation,
  setSearchLocation,
  selectedLocation,
  isSearching,
  handleSearch,
  handleClearLocation,
  filters,
  handleFilterChange,
  buildingsCount
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
          Encontre Prédios para seus Painéis
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
            <label className="block text-sm mb-2 text-gray-700 font-medium">Tipo de Prédio</label>
            <select
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none shadow-sm transition-all duration-200"
              value={filters.venueType.length > 0 ? filters.venueType[0] : ''}
              onChange={(e) => handleFilterChange({ 
                venueType: e.target.value ? [e.target.value] : [] 
              })}
            >
              <option value="">Todos os tipos</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Misto">Misto</option>
              <option value="Corporativo">Corporativo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-gray-700 font-medium">Padrão do Público</label>
            <select
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none shadow-sm transition-all duration-200"
              value={filters.standardProfile.length > 0 ? filters.standardProfile[0] : ''}
              onChange={(e) => handleFilterChange({ 
                standardProfile: e.target.value ? [e.target.value] : [] 
              })}
            >
              <option value="">Todos os padrões</option>
              <option value="alto">Alto Padrão</option>
              <option value="medio">Médio Padrão</option>
              <option value="normal">Padrão Normal</option>
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
                {buildingsCount} resultado{buildingsCount !== 1 ? 's' : ''} no raio de {filters.radius / 1000} km
              </span>
              <select 
                className="px-2 py-1 text-sm border rounded-full focus:outline-none focus:ring-1 focus:ring-indexa-purple bg-white shadow-sm transition-all duration-200"
                value={filters.radius}
                onChange={(e) => handleFilterChange({ radius: Number(e.target.value) })}
              >
                <option value="1000">1km</option>
                <option value="3000">3km</option>
                <option value="5000">5km</option>
                <option value="10000">10km</option>
                <option value="20000">20km</option>
              </select>
            </div>
          </div>
        )}
        
        {!selectedLocation && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {buildingsCount} prédio{buildingsCount !== 1 ? 's' : ''} disponível{buildingsCount !== 1 ? 'eis' : ''} em nossa rede
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BuildingSearchSection;
