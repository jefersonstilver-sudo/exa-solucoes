
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
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
          className="bg-[#3C1361] hover:bg-[#3C1361]/90"
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

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {cartItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {item.panel?.buildings?.nome || 'Painel'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {item.panel?.buildings?.endereco || 'Endereço não disponível'}
                  </p>
                  
                  {/* Informações adicionais do prédio */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {item.panel?.buildings?.publico_estimado && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">{item.panel.buildings.publico_estimado.toLocaleString()}</span>
                        <span className="text-gray-500">pessoas/mês</span>
                      </div>
                    )}
                    
                    {item.panel?.buildings?.quantidade_telas && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{item.panel.buildings.quantidade_telas}</span>
                        <span className="text-gray-500">{item.panel.buildings.quantidade_telas === 1 ? 'tela' : 'telas'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Price */}
              <div className="flex justify-end">
                <div className="text-lg font-semibold text-[#3C1361]">
                  {formatCurrency(item.price || 0)}
                </div>
              </div>
            </motion.div>
          ))}
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
              {cartItems.reduce((sum, item) => sum + (item.panel?.buildings?.quantidade_telas || 0), 0)}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">Pessoas/mês</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {cartItems.reduce((sum, item) => sum + (item.panel?.buildings?.publico_estimado || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">Total:</span>
          <span className="text-2xl font-bold text-[#3C1361]">
            {formatCurrency(totalPrice)}
          </span>
        </div>
        
        <Button
          onClick={handleCheckout}
          disabled={isProcessing || isCheckoutLoading}
          className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white font-medium py-3"
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
