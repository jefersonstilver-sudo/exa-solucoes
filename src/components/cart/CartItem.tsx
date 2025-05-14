
import React from 'react';
import { Panel } from '@/types/panel';
import { formatCurrency } from '@/utils/formatters';
import PeriodSelector from '@/components/cart/PeriodSelector';

interface CartItemProps {
  item: { panel: Panel; duration: number };
  onRemove: (panelId: string) => void;
  onChangeDuration: (panelId: string, duration: number) => void;
  calculatePrice: (panel: Panel, days: number) => number;
}

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onRemove, 
  onChangeDuration,
  calculatePrice 
}) => {
  const panel = item.panel;
  
  const handleChangeDuration = (days: number) => {
    onChangeDuration(panel.id, days);
  };
  
  // Function to format the location using buildings data
  const formatPanelLocation = (panel: Panel) => {
    if (panel.buildings) {
      return `${panel.buildings.bairro}, ${panel.buildings.city || ''}`;
    }
    return 'Local não especificado';
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-3">
      <div className="flex flex-col sm:flex-row">
        {/* Panel image and basic info */}
        <div className="w-full sm:w-1/3 p-3">
          {panel.buildings?.imageUrl ? (
            <img 
              src={panel.buildings.imageUrl}
              alt={panel.buildings?.nome || 'Painel'}
              className="rounded-xl object-cover w-full h-48 sm:h-full"
            />
          ) : (
            <div className="bg-gray-200 rounded-xl w-full h-48 sm:h-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">Imagem não disponível</span>
            </div>
          )}
        </div>
        
        {/* Period selector and price */}
        <div className="w-full sm:w-2/3 p-3 border-t sm:border-t-0 sm:border-l border-gray-200">
          <div className="flex flex-col h-full">
            <div className="mb-2">
              <h3 className="text-sm font-semibold">{panel.buildings?.nome || 'Painel sem nome'}</h3>
              <p className="text-xs text-gray-500">{formatPanelLocation(panel)}</p>
            </div>
            
            <PeriodSelector 
              selectedPeriod={item.duration}
              onSelectPeriod={handleChangeDuration}
            />
            
            <div className="flex justify-between items-end mt-auto">
              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {formatCurrency(calculatePrice(panel, item.duration))}
                </p>
              </div>
              
              <button 
                onClick={() => onRemove(panel.id)}
                className="text-red-500 hover:text-red-700 transition-colors text-sm"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
