
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trash2, Building, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartItem } from '@/types/cart';
import { formatCurrency } from '@/utils/formatters';

interface ModernCartItemProps {
  item: CartItem;
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
}

const ModernCartItem: React.FC<ModernCartItemProps> = ({
  item,
  onRemove,
  onChangeDuration
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
    // Pequeno delay para animação
    setTimeout(() => {
      onRemove(panel.id);
    }, 150);
  };

  return (
    <motion.div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
        hover:shadow-md transition-shadow duration-300
        ${isRemoving ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: 1.005 }}
      layout
    >
      <div className="flex flex-col">
        {/* Imagem - Muito mais compacta */}
        <div className="w-full relative">
          {panel.buildings?.imageUrl ? (
            <div className="relative group">
              <img 
                src={panel.buildings.imageUrl}
                alt={panel.buildings?.nome || 'Painel'}
                className="w-full h-20 object-cover"
              />
              {/* Overlay simplificado */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center text-white text-xs space-x-1">
                    <Eye className="h-2.5 w-2.5" />
                    <span>{panel.buildings?.apartments || 100} apts</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-20 flex items-center justify-center">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          {/* Badge de status - menor */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-green-100 text-green-700 border-none text-xs px-2 py-0.5"
          >
            Ativo
          </Badge>
        </div>
        
        {/* Conteúdo - muito mais compacto */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {panel.buildings?.nome || 'Painel sem nome'}
              </h3>
              <div className="flex items-center text-gray-500 text-xs mt-0.5">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{formatLocation()}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors p-1 h-6 w-6"
              title="Remover item"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Tipo de local - mais discreto */}
          {panel.buildings?.venue_type && (
            <Badge variant="outline" className="mb-2 text-xs px-1.5 py-0.5">
              {panel.buildings.venue_type}
            </Badge>
          )}
          
          {/* Preço - menor mas ainda destacado */}
          <div className="flex items-center justify-between mt-2">
            <div className="text-xl font-bold text-[#3C1361]">
              {formatCurrency(item.price)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernCartItem;
