
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BuildingStore, buildingToPanel } from '@/services/buildingStoreService';
import { Panel } from '@/types/panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
  const isMobile = useIsMobile();

  const handleAddToCart = async () => {
    if (isAdded) return;
    
    try {
      // Converter Building para Panel antes de adicionar ao carrinho
      const panel = buildingToPanel(building);
      
      console.log('🛒 [BUILDING STORE CARD] Adicionando ao carrinho:', {
        building: building.nome,
        panel: panel.id,
        panelCode: panel.code
      });
      
      setIsAnimating(true);
      setIsAdded(true);
      
      // Chamar função real de adicionar ao carrinho
      await onAddToCart(panel, 30); // Duração padrão de 30 dias
      
      // Toast de sucesso
      toast.success(`${building.nome} adicionado ao carrinho!`, {
        description: "Painel adicionado com duração de 30 dias",
        duration: 3000,
      });
      
      // Animação de feedback
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      
      // Reset do botão após alguns segundos
      setTimeout(() => {
        setIsAdded(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ [BUILDING STORE CARD] Erro ao adicionar ao carrinho:', error);
      setIsAdded(false);
      setIsAnimating(false);
      
      toast.error('Erro ao adicionar ao carrinho', {
        description: "Tente novamente em alguns instantes",
        duration: 3000,
      });
    }
  };

  return (
    <div className={`flex items-start justify-between pt-4 border-t border-gray-100 ${
      isMobile ? 'flex-col space-y-3' : 'flex-col lg:flex-row'
    }`}>
      <div className={isMobile ? 'w-full' : 'mb-3 lg:mb-0'}>
        <p className="text-xs text-gray-600 mb-1">A partir de</p>
        <p className={`font-bold text-indexa-purple ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          R$ {building.preco_base || 280}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {building.quantidade_telas} painel{building.quantidade_telas !== 1 ? 'éis' : ''} disponível{building.quantidade_telas !== 1 ? 'eis' : ''}
        </p>
      </div>
      
      <div className={`flex ${isMobile ? 'w-full justify-center' : 'justify-center lg:justify-end'}`}>
        {/* Botão Adicionar ao Carrinho */}
        <motion.div
          animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.6 }}
          className={isMobile ? 'w-full' : ''}
        >
          <Button
            onClick={handleAddToCart}
            size={isMobile ? "default" : "sm"}
            disabled={isAdded}
            className={`font-semibold transition-all duration-300 ${
              isMobile ? 'w-full py-3 text-base' : 'px-6 py-2 text-sm'
            } ${
              isAdded 
                ? 'bg-green-500 hover:bg-green-500 text-white cursor-default' 
                : 'bg-indexa-purple hover:bg-indexa-purple-dark text-white hover:scale-105'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                {isMobile ? 'Adicionar ao Carrinho' : 'Adicionar ao Carrinho'}
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BuildingCardActions;
