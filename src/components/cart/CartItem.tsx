
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Panel } from '@/types/panel';

interface CartItemProps {
  item: { panel: Panel; duration: number };
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  calculatePrice: (panel: Panel, days: number) => number;
}

const durationOptions = [30, 60, 90, 180, 365];

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onRemove, 
  onChangeDuration,
  calculatePrice 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-24 h-24 bg-gray-100 relative">
              <img 
                src={item.panel.buildings?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
                alt={item.panel.buildings?.nome || 'Building image'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm text-[#3C1361] line-clamp-1">
                    {item.panel.buildings?.nome || 'Painel Digital'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 mb-1.5 line-clamp-1">
                    {item.panel.buildings?.endereco || 'Endereço não disponível'}
                  </p>
                  
                  <Select
                    value={item.duration.toString()}
                    onValueChange={(value) => onChangeDuration(item.panel.id, parseInt(value))}
                  >
                    <SelectTrigger className="h-7 w-[90px] text-xs">
                      <SelectValue placeholder="30 dias" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((days) => (
                        <SelectItem key={days} value={days.toString()}>
                          {days === 30 ? '1 mês' : `${Math.floor(days/30)} meses`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-gray-400 hover:text-red-600"
                    onClick={() => onRemove(item.panel.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <p className="text-sm font-medium text-[#3C1361] mt-auto">
                    {formatCurrency(calculatePrice(item.panel, item.duration))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CartItem;
