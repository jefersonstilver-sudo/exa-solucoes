
import React from 'react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/types/panel';
import { XCircle, ShoppingCart, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface PanelCartProps {
  cartItems: CartItem[];
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  onProceedToCheckout: () => void;
}

const PanelCart: React.FC<PanelCartProps> = ({
  cartItems,
  onRemove,
  onChangeDuration,
  onProceedToCheckout
}) => {
  const hasItems = cartItems.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-2xl z-30">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="text-purple-600 mr-2" />
            <span className="font-semibold">
              {hasItems ? `${cartItems.length} item(s) no carrinho` : 'Seu carrinho está vazio'}
            </span>
          </div>

          {hasItems && (
            <Button 
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onProceedToCheckout}
            >
              Prosseguir para checkout
            </Button>
          )}
        </div>
        
        {hasItems && (
          <motion.div 
            className="mt-3 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            {cartItems.map((item) => (
              <div 
                key={item.panel.id} 
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 overflow-hidden">
                    {item.panel.buildings?.imageUrl && (
                      <img 
                        src={item.panel.buildings.imageUrl} 
                        alt={item.panel.buildings.nome || 'Painel'} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.panel.buildings?.nome || 'Painel'}</p>
                    <p className="text-xs text-gray-500">{item.panel.buildings?.endereco || 'Endereço indisponível'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    <select
                      value={item.duration}
                      onChange={(e) => onChangeDuration(item.panel.id, parseInt(e.target.value))}
                      className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1"
                    >
                      <option value={7}>7 dias</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={60}>60 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => onRemove(item.panel.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PanelCart;
