
import React from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface SearchInputProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
}

const SearchInput: React.FC<SearchInputProps> = ({
  searchLocation,
  setSearchLocation,
  isSearching,
  handleSearch
}) => {
  return (
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
  );
};

export default SearchInput;
