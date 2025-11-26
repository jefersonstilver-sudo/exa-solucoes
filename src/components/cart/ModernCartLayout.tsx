
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight, Play, DollarSign, Building2, ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem } from '@/types/cart';
import { formatCurrency } from '@/utils/priceUtils';
import { useSimplifiedCheckout } from '@/hooks/useSimplifiedCheckout';

interface ModernCartLayoutProps {
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onChangeDuration: (id: string, duration: number) => void;
  onProceedToCheckout: () => void;
  isCheckoutLoading: boolean;
}

const ModernCartLayout = ({
  cartItems,
  onRemove,
  onClear,
  onChangeDuration,
  onProceedToCheckout,
  isCheckoutLoading
}: ModernCartLayoutProps) => {
  const [isClearing, setIsClearing] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { proceedToCheckout, isProcessing, canProceed } = useSimplifiedCheckout();

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleClearCart = async () => {
    setIsClearing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onClear();
    setIsClearing(false);
  };

  // CORREÇÃO: Usar o checkout simplificado
  const handleCheckout = async () => {
    console.log('🛒 [ModernCartLayout] Botão checkout clicado');
    
    // Usar o novo sistema de checkout simplificado
    const success = await proceedToCheckout();
    
    if (success) {
      // Callback original para compatibilidade
      onProceedToCheckout();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </motion.div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Seu carrinho está vazio
        </h3>
        <p className="text-gray-500 mb-6">
          Adicione painéis para criar sua campanha
        </p>
        <Button 
          onClick={() => window.location.href = '/paineis-digitais/loja'}
          className="bg-[#9C1E1E] hover:bg-[#7A1818]"
        >
          Ver Painéis Disponíveis
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Carrinho ({cartItems.length})
          </h2>
          {cartItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isClearing ? (
                <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="ml-2">Limpar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items - Compacto com Expand */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {cartItems.map((item) => {
            const isExpanded = expandedItems[item.id];
            const publicoEstimado = item.panel?.buildings?.publico_estimado || 0;
            const numeroTelas = item.panel?.buildings?.numero_elevadores || item.panel?.buildings?.quantidade_telas || 0;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-white border rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Header - Sempre Visível */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    >
                      <Building2 className="h-4 w-4 text-[#9C1E1E] flex-shrink-0" />
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {item.panel?.buildings?.nome || 'Painel'}
                      </h4>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </motion.div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🗑️ [ModernCartLayout] Removendo item:', item.panel.id);
                        onRemove(item.panel.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Info Compacta - Sempre Visível */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      {numeroTelas > 0 && (
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">{numeroTelas}</span>
                          <span className="text-gray-600">{numeroTelas === 1 ? 'tela' : 'telas'}</span>
                        </div>
                      )}
                      
                      {publicoEstimado > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-600">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-semibold">{publicoEstimado.toLocaleString('pt-BR')}</span>
                          <span className="text-gray-600">pessoas/mês</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-base font-bold text-[#9C1E1E]">
                      {formatCurrency(item.price || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Detalhes Expandidos - Condicional */}
                <motion.div
                  initial={false}
                  animate={{ 
                    height: isExpanded ? 'auto' : 0,
                    opacity: isExpanded ? 1 : 0 
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">
                      {item.panel?.buildings?.endereco || 'Endereço não disponível'}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer with Total and Checkout */}
      <div className="border-t bg-white p-4 space-y-4 mt-auto sticky bottom-0">
        {/* Resumo de impacto */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">Total de Telas</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {cartItems.reduce((sum, item) => sum + (item.panel?.buildings?.numero_elevadores || 0), 0)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Exibições por mês</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {cartItems.reduce((sum, item) => sum + (item.panel?.buildings?.visualizacoes_mes || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Investimento Diário */}
        <div className="bg-gradient-to-br from-[#9C1E1E]/5 to-[#9C1E1E]/10 rounded-lg p-3 border border-[#9C1E1E]/20">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-[#9C1E1E]" />
            <span className="text-xs font-semibold text-[#9C1E1E]">Investimento Diário</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-600 mb-0.5">Exibições/dia</p>
              <p className="text-base font-bold text-[#9C1E1E]">
                {Math.round(cartItems.reduce((sum, item) => sum + (item.panel?.buildings?.visualizacoes_mes || 0), 0) / 30).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-0.5">R$/dia/painel</p>
              <p className="text-base font-bold text-[#9C1E1E]">
                {formatCurrency(totalPrice / 30 / cartItems.length)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold text-[#9C1E1E]">
            {formatCurrency(totalPrice)}
          </span>
        </div>
        
        <Button
          onClick={handleCheckout}
          disabled={isProcessing || isCheckoutLoading}
          className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white font-medium py-3"
          size="lg"
        >
          {isProcessing || isCheckoutLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processando...
            </>
          ) : (
            <>
              <span>Finalizar Compra</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

      </div>
    </div>
  );
};

export default ModernCartLayout;
