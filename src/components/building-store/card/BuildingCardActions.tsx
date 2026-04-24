
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Construction } from 'lucide-react';
import { BuildingStore } from '@/services/buildingStoreService';
import { adaptBuildingToPanel } from '@/services/buildingToPanelAdapter';
import { toast } from 'sonner';
import { useCart } from '@/contexts/SimpleCartContext';

interface BuildingCardActionsProps {
  building: BuildingStore;
}

const isInstallationStatus = (status?: string) =>
  String(status || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('instala');

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ building }) => {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, isItemInCart } = useCart();

  const inCart = isItemInCart(building.id);
  const emInstalacao = isInstallationStatus(building.status);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (emInstalacao || inCart || isAdding) return;

    try {
      setIsAdding(true);
      const panel = adaptBuildingToPanel(building);
      await addToCart(panel, 30);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(`Erro ao adicionar ${building.nome} ao carrinho`);
    } finally {
      setIsAdding(false);
    }
  };

  // Em instalação: vitrine apenas
  if (emInstalacao) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-amber-700/80 mb-0.5 font-medium">Status</p>
          <p className="text-base font-semibold text-amber-700">Em breve</p>
        </div>
        <Button
          disabled
          aria-disabled="true"
          onClick={(e) => e.stopPropagation()}
          className="font-medium px-5 py-2.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed hover:bg-amber-100 disabled:opacity-100"
        >
          <Construction className="h-4 w-4 mr-2" />
          Em Instalação
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-0.5">A partir de</p>
        <p className="text-2xl font-bold text-[#9C1E1E]">
          R$ {building.preco_base || 280}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
      </div>

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
