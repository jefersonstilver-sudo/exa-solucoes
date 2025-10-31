
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2, Plus } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { convertBuildingToPanel } from '@/services/buildingToPanelService';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useCart } from '@/contexts/SimpleCartContext';

interface BuildingCardActionsProps {
  building: BuildingStore;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ building }) => {
  const [isAdding, setIsAdding] = useState(false);
  const isMobile = useIsMobile();
  const { addToCart, isItemInCart } = useCart();
  
  const inCart = isItemInCart(building.id);

  const handleAddToCart = async () => {
    if (inCart || isAdding) return;
    
    try {
      setIsAdding(true);
      const panel = convertBuildingToPanel(building);
      await addToCart(panel, 30);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(`Erro ao adicionar ${building.nome} ao carrinho`);
    } finally {
      setIsAdding(false);
    }
  };

  const getButtonContent = () => {
    if (isAdding) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adicionando...
        </>
      );
    }
    
    if (inCart) {
      return (
        <>
          <Check className="h-4 w-4 mr-2" />
          No Carrinho
        </>
      );
    }
    
    return (
      <>
        <Plus className="h-4 w-4 mr-2" />
        {isMobile ? 'Adicionar ao Carrinho' : 'Adicionar'}
        <ShoppingCart className="h-3 w-3 ml-1" />
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass = `font-semibold transition-all duration-200 ${
      isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
    }`;

    if (isAdding) {
      return `${baseClass} bg-[#9C1E1E]/80 text-white cursor-wait`;
    }
    
    if (inCart) {
      return `${baseClass} bg-green-500 hover:bg-green-500 text-white cursor-default`;
    }
    
    return `${baseClass} bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white hover:scale-105 active:scale-95`;
  };

  return (
    <div className={`flex items-start justify-between pt-4 border-t border-gray-100 ${
      isMobile ? 'flex-col space-y-3' : 'flex-col lg:flex-row'
    }`}>
      <div className={isMobile ? 'w-full' : 'mb-3 lg:mb-0'}>
        <p className="text-xs text-gray-600 mb-1">A partir de</p>
        <p className={`font-bold text-[#9C1E1E] ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          R$ {building.preco_base || 280}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
        </p>
      </div>
      
      <div className={`flex ${isMobile ? 'w-full justify-center' : 'justify-center lg:justify-end'}`}>
        <Button
          onClick={handleAddToCart}
          size={isMobile ? "default" : "sm"}
          disabled={inCart || isAdding}
          className={getButtonClass()}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};

export default BuildingCardActions;
