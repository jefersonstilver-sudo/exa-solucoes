
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
        bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden
        hover:shadow-md transition-shadow duration-300
        ${isRemoving ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: 1.01 }}
      layout
    >
      <div className="flex flex-col">
        {/* Imagem - Agora mais quadrada */}
        <div className="w-full relative">
          {panel.buildings?.imageUrl ? (
            <div className="relative group">
              <img 
                src={panel.buildings.imageUrl}
                alt={panel.buildings?.nome || 'Painel'}
                className="w-full h-32 object-cover"
              />
              {/* Overlay com informações extras */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center text-white text-xs space-x-2">
                    <Eye className="h-3 w-3" />
                    <span>{panel.buildings?.apartments || 100} apartamentos</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-32 flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {/* Badge de status */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-green-100 text-green-700 border-none"
          >
            Ativo
          </Badge>
        </div>
        
        {/* Conteúdo */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {panel.buildings?.nome || 'Painel sem nome'}
              </h3>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{formatLocation()}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors p-2"
              title="Remover item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tipo de local */}
          {panel.buildings?.venue_type && (
            <Badge variant="outline" className="mb-3 text-xs">
              {panel.buildings.venue_type}
            </Badge>
          )}
          
          {/* Preço */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-2xl font-bold text-[#3C1361]">
              {formatCurrency(item.price)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModernCartItem;
