
import React from 'react';
import { Building, Calendar, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';

interface CartItemProps {
  panel: Panel;
  duration: number;
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  price: string;
}

const durationOptions = [30, 60, 90, 180, 365];

const CartItem: React.FC<CartItemProps> = ({ 
  panel, 
  duration, 
  onRemove, 
  onChangeDuration, 
  price 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start">
          <Building className="h-4 w-4 mt-1 mr-2 text-indexa-purple flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm">{panel.buildings?.nome}</h4>
            <p className="text-xs text-muted-foreground">{panel.buildings?.bairro}</p>
          </div>
        </div>
        <button 
          onClick={() => onRemove(panel.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex items-center mb-2 ml-6">
        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        <div className="flex items-center text-sm flex-1">
          <span className="mr-2">Duração:</span>
          <select 
            className="border rounded px-2 py-1 text-xs border-indexa-purple focus:outline-indexa-mint"
            value={duration}
            onChange={(e) => onChangeDuration(panel.id, parseInt(e.target.value))}
          >
            {durationOptions.map(days => (
              <option key={days} value={days}>{days} dias</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm ml-6">
        <span>Preço:</span>
        <span className="font-semibold">{price}</span>
      </div>
      
      <Separator className="my-3" />
    </motion.div>
  );
};

export default CartItem;
