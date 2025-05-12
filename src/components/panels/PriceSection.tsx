
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/types/panel';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PriceSectionProps {
  price: number;
  price60: number;
  price90: number;
  inCart: boolean;
  panel: Panel;
  onAddToCart: (panel: Panel, duration: number) => void;
}

export const PriceSection: React.FC<PriceSectionProps> = ({
  price,
  price60,
  price90,
  inCart,
  panel,
  onAddToCart
}) => {
  const [selectedDays, setSelectedDays] = useState(30);
  const [animateButton, setAnimateButton] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Calculate discount percentage based on duration
  const getDiscount = (days: number) => {
    if (days >= 90) return 15;
    if (days >= 60) return 10;
    if (days >= 30) return 5;
    return 0;
  };
  
  // Calculate original price without discount
  const getOriginalPrice = (days: number, price: number) => {
    const discount = getDiscount(days);
    if (discount === 0) return price;
    return Math.round(price / (1 - discount / 100));
  };

  const handleAddToCart = () => {
    // Animate button
    setAnimateButton(true);
    
    // Add to cart
    onAddToCart(panel, selectedDays);
    
    // Reset animation after a delay
    setTimeout(() => {
      setAnimateButton(false);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Selected price */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center">
            <p className="text-2xl font-bold text-indexa-purple">
              {selectedDays === 30 ? formatCurrency(price) : 
               selectedDays === 60 ? formatCurrency(price60) : 
               formatCurrency(price90)}
            </p>
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
              {getDiscount(selectedDays)}% OFF
            </Badge>
          </div>
          <p className="text-xs text-gray-500 line-through">
            {formatCurrency(getOriginalPrice(
              selectedDays, 
              selectedDays === 30 ? price : 
              selectedDays === 60 ? price60 : 
              price90
            ))}
          </p>
        </div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            className={`bg-indexa-mint text-gray-800 hover:bg-indexa-mint-dark transition-all`}
            onClick={handleAddToCart}
            disabled={inCart}
            variant="default"
          >
            <motion.div
              className="flex items-center"
              animate={animateButton ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6 }}
            >
              {inCart ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  No carrinho
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Adicionar
                </>
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>
      
      {/* Duration selector buttons */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700 font-medium">Selecione a duração:</p>
          <button 
            className="text-xs text-indexa-purple hover:underline flex items-center"
            onClick={() => setShowAllPrices(!showAllPrices)}
          >
            {showAllPrices ? (
              <>
                Ocultar planos <ChevronUp className="h-3 w-3 ml-1" />
              </>
            ) : (
              <>
                Ver todos os planos <ChevronDown className="h-3 w-3 ml-1" />
              </>
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant={selectedDays === 30 ? "default" : "outline"}
            className={`text-xs h-10 ${selectedDays === 30 ? 'bg-indexa-purple text-white' : 'border border-indexa-purple/30 text-indexa-purple'}`}
            onClick={() => setSelectedDays(30)}
          >
            30 dias
          </Button>
          <Button 
            variant={selectedDays === 60 ? "default" : "outline"}
            className={`text-xs h-10 ${selectedDays === 60 ? 'bg-indexa-purple text-white' : 'border border-indexa-purple/30 text-indexa-purple'}`}
            onClick={() => setSelectedDays(60)}
          >
            60 dias
          </Button>
          <Button 
            variant={selectedDays === 90 ? "default" : "outline"}
            className={`text-xs h-10 ${selectedDays === 90 ? 'bg-indexa-purple text-white' : 'border border-indexa-purple/30 text-indexa-purple'}`}
            onClick={() => setSelectedDays(90)}
          >
            90 dias
          </Button>
        </div>
      </div>
      
      {/* Extended pricing info */}
      {showAllPrices && (
        <div className="mt-4 bg-gray-50 p-3 rounded-md text-xs">
          <h4 className="font-medium text-gray-700 mb-2">Planos de exibição:</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="flex items-center">
                <Badge className="mr-2 bg-indexa-purple/20 text-indexa-purple hover:bg-indexa-purple/20">Mensal</Badge>
                <span>30 dias</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 line-through mr-2">{formatCurrency(getOriginalPrice(30, price))}</span>
                <span className="font-medium">{formatCurrency(price)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Badge className="mr-2 bg-indexa-purple/20 text-indexa-purple hover:bg-indexa-purple/20">Bimestral</Badge>
                <span>60 dias</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 line-through mr-2">{formatCurrency(getOriginalPrice(60, price60))}</span>
                <span className="font-medium">{formatCurrency(price60)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="flex items-center">
                <Badge className="mr-2 bg-indexa-purple/20 text-indexa-purple hover:bg-indexa-purple/20">Trimestral</Badge>
                <span>90 dias</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 line-through mr-2">{formatCurrency(getOriginalPrice(90, price90))}</span>
                <span className="font-medium">{formatCurrency(price90)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-gray-600">Planos mais longos têm descontos maiores e benefícios extras.</p>
          </div>
        </div>
      )}
    </div>
  );
};
