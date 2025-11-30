
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2, Plus } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
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
      // Usar adaptador para converter Building para Panel temporariamente
      const panel = adaptBuildingToPanel(building);
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
    <div className="flex items-center justify-between">
      {/* Preço */}
      <div>
        <p className="text-sm text-gray-500 mb-0.5">A partir de</p>
        <p className="text-2xl font-bold text-[#9C1E1E]">
          R$ {building.preco_base || 280}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
      </div>
      
      {/* Botão */}
      <Button
        onClick={handleAddToCart}
        disabled={inCart || isAdding}
        className={`font-medium px-6 py-2.5 rounded-lg transition-all ${
          inCart 
            ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
            : 'bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white'
        }`}
      >
        {isAdding ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adicionando...
          </div>
        ) : inCart ? (
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" />
            No Carrinho
          </div>
        ) : (
          <span>Continuar →</span>
        )}
      </Button>
    </div>
  );
};

export default BuildingCardActions;
