
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import { formatCurrency } from '@/utils/formatters';

interface ModernCartItemProps {
  item: CartItem;
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  // ADICIONADO: Preço deve ser passado de fora, calculado com plano
  displayPrice?: number;
}

const ModernCartItem: React.FC<ModernCartItemProps> = ({
  item,
  onRemove,
  onChangeDuration,
  displayPrice
}) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const panel = item.panel;
  
  const formatLocation = () => {
    if (panel.buildings) {
      return `${panel.buildings.bairro}, ${panel.buildings?.cidade || ''}`;
    }
    return 'Localização não especificada';
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(panel.id);
    }, 150);
  };

  return (
    <motion.div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden
        hover:shadow-md transition-shadow duration-300
        ${isRemoving ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: 1.002 }}
      layout
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {panel.buildings?.nome || 'Painel sem nome'}
            </h3>
            <div className="flex items-center text-gray-500 text-xs mt-1">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{formatLocation()}</span>
            </div>
            {/* CORRIGIDO: Só mostra preço se foi calculado */}
            {displayPrice !== undefined && (
              <div className="text-lg font-bold text-[#3C1361] mt-1">
                {formatCurrency(displayPrice)}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors p-1 h-7 w-7 ml-2 flex-shrink-0"
            title="Remover item"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernCartItem;
