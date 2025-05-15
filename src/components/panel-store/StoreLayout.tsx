
import React from 'react';
import { motion } from 'framer-motion';
import { Panel } from '@/types/panel';
import { FilterOptions } from '@/types/filter';
import SearchSection from '@/components/panels/SearchSection';
import PanelFilterSidebar from '@/components/panels/PanelFilterSidebar';
import PanelCardList from '@/components/panels/PanelCardList';

interface StoreLayoutProps {
  panels: Panel[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  selectedLocation: { lat: number, lng: number } | null;
  filters: FilterOptions;
  handleFilterChange: (newFilters: Partial<FilterOptions>) => void;
  handleSearch: (location: string) => Promise<void>;
  handleClearLocation: () => void;
  cartItems: { panel: Panel, duration: number }[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const StoreLayout: React.FC<StoreLayoutProps> = ({
  panels,
  isLoading,
  isSearching,
  searchLocation,
  setSearchLocation,
  selectedLocation,
  filters,
  handleFilterChange,
  handleSearch,
  handleClearLocation,
  cartItems,
  onAddToCart
}) => {
  return (
    <>
      {/* Search section */}
      <SearchSection 
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        selectedLocation={selectedLocation}
        isSearching={isSearching}
        handleSearch={handleSearch}
        handleClearLocation={handleClearLocation}
        filters={filters}
        handleFilterChange={handleFilterChange}
        panelsCount={panels?.length || 0}
      />
      
      {/* New layout with sidebar on left and single column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-8">
        {/* Left sidebar with filters and map */}
        <div className="lg:col-span-3 xl:col-span-3">
          <PanelFilterSidebar 
            filters={filters}
            handleFilterChange={handleFilterChange}
            isLoading={isLoading}
            isSearching={isSearching}
          />
        </div>
        
        {/* Main content with panel cards in vertical column */}
        <div className="lg:col-span-9 xl:col-span-9">
          <PanelCardList 
            panels={panels}
            isLoading={isLoading}
            isSearching={isSearching}
            cartItems={cartItems}
            onAddToCart={onAddToCart}
            selectedLocation={selectedLocation}
          />
        </div>
      </div>
    </>
  );
};

export default StoreLayout;
