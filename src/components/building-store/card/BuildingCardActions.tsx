
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';

interface BuildingCardActionsProps {
  building: BuildingStore;
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const BuildingCardActions: React.FC<BuildingCardActionsProps> = ({ 
  building, 
  onAddToCart 
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddToCart = () => {
    if (isAdded) return;
    
    try {
      // Converter Building para Panel antes de adicionar ao carrinho
      const panel = buildingToPanel(building);
      
      console.log('🛒 [BUILDING STORE CARD] Convertendo building para panel:', {
        building: building.nome,
        panel: panel.id,
        panelCode: panel.code
      });
      
      setIsAnimating(true);
      setIsAdded(true);
      
      // Chamar função real de adicionar ao carrinho
      onAddToCart(panel, 30); // Duração padrão de 30 dias
      
      // Animação de feedback
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      
    } catch (error) {
      console.error('❌ [BUILDING STORE CARD] Erro ao adicionar ao carrinho:', error);
      setIsAdded(false);
      setIsAnimating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pt-6 border-t border-gray-100">
      <div className="mb-4 lg:mb-0">
        <p className="text-sm text-gray-600 mb-1">A partir de</p>
        <p className="text-3xl font-bold text-indexa-purple">
          R$ {building.preco_base || 280}
          <span className="text-lg font-normal text-gray-500">/mês</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
        </p>
      </div>
      
      <div className="flex justify-center lg:justify-end">
        {/* Botão Adicionar ao Carrinho */}
        <motion.div
          animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={handleAddToCart}
            size="lg"
            disabled={isAdded}
            className={`px-8 py-3 text-base font-semibold transition-all duration-300 ${
              isAdded 
                ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
                : 'bg-indexa-purple hover:bg-indexa-purple-dark text-white hover:scale-105'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao Carrinho
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BuildingCardActions;
