
import React, { useState } from 'react';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PanelCardVertical from './PanelCardVertical';
import LoadingPanels from './LoadingPanels';
import EmptyResults from './EmptyResults';

interface PanelCardListProps {
  panels: Panel[] | undefined;
  isLoading: boolean;
  isSearching: boolean;
  cartItems: {panel: Panel, duration: number}[];
  onAddToCart: (panel: Panel, duration?: number) => void;
  selectedLocation: {lat: number, lng: number} | null;
}

const PanelCardList: React.FC<PanelCardListProps> = ({ 
  panels, 
  isLoading, 
  isSearching,
  cartItems, 
  onAddToCart,
  selectedLocation
}) => {
  // Sort state
  const [sortOption, setSortOption] = useState('distance');

  // Calculate if a panel is in cart
  const isPanelInCart = (panelId: string) => {
    return cartItems.some(item => item.panel.id === panelId);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  if (isLoading || isSearching) {
    return <LoadingPanels vertical={true} count={5} />;
  }

  if (!panels || panels.length === 0) {
    return <EmptyResults />;
  }
  
  // Sort panels based on selected option
  const sortedPanels = [...panels].sort((a, b) => {
    if (sortOption === 'distance' && a.distance && b.distance) {
      return a.distance - b.distance;
    } else if (sortOption === 'price-asc') {
      // Real price calculation from building data with proper type handling
      const priceA = (a.buildings as any)?.preco_base || 0;
      const priceB = (b.buildings as any)?.preco_base || 0;
      return priceA - priceB;
    } else if (sortOption === 'price-desc') {
      const priceA = (a.buildings as any)?.preco_base || 0;
      const priceB = (b.buildings as any)?.preco_base || 0;
      return priceB - priceA;
    } else if (sortOption === 'views-desc') {
      // Real view count sorting from building data with proper type handling
      const viewsA = (a.buildings as any)?.visualizacoes_mes || 0;
      const viewsB = (b.buildings as any)?.visualizacoes_mes || 0;
      return viewsB - viewsA;
    }
    return 0;
  });

  return (
    <div className="space-y-6 mb-10">
      {/* Search Results Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#3C1361]">
            Painéis Digitais
          </h1>
          <p className="text-gray-500 mt-1">
            {panels.length} painéis disponíveis {selectedLocation ? 'próximos à localização selecionada' : 'em nossa rede'}
          </p>
        </div>
        
        <Select 
          defaultValue="distance"
          value={sortOption}
          onValueChange={setSortOption}
        >
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Mais próximos</SelectItem>
            <SelectItem value="price-asc">Preço: menor para maior</SelectItem>
            <SelectItem value="price-desc">Preço: maior para menor</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Panel Results */}
      {sortedPanels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum painel encontrado</h3>
          <p className="text-gray-500 max-w-md">
            Tente ajustar seus filtros ou buscar em outra localização para encontrar painéis disponíveis.
          </p>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {sortedPanels.map(panel => (
            <PanelCardVertical
              key={panel.id}
              panel={panel}
              inCart={isPanelInCart(panel.id)}
              onAddToCart={onAddToCart}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PanelCardList;
