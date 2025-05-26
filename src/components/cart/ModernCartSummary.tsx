
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatters';

interface ModernCartSummaryProps {
  itemCount: number;
  totalPrice: number;
  onProceedToCheckout: () => void;
  isLoading?: boolean;
}

const ModernCartSummary: React.FC<ModernCartSummaryProps> = ({
  itemCount,
  totalPrice,
  onProceedToCheckout,
  isLoading = false
}) => {
  return (
    <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
      {/* Resumo de preços */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Subtotal ({itemCount} {itemCount === 1 ? 'painel' : 'painéis'})
          </span>
          <span className="font-medium">{formatCurrency(totalPrice)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Taxa de processamento</span>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">
            Grátis
          </Badge>
        </div>
        
        <hr className="border-gray-200" />
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <motion.span 
            className="text-2xl font-bold text-[#3C1361]"
            key={totalPrice}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {formatCurrency(totalPrice)}
          </motion.span>
        </div>
      </div>

      {/* Botão de checkout */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onProceedToCheckout}
          disabled={isLoading || itemCount === 0}
          className="w-full bg-gradient-to-r from-[#3C1361] to-[#4A1A6B] hover:from-[#4A1A6B] hover:to-[#3C1361] text-white py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Zap className="h-5 w-5" />
            </motion.div>
          ) : (
            <CreditCard className="h-5 w-5 mr-2" />
          )}
          {isLoading ? 'Processando...' : 'Finalizar Compra'}
        </Button>
      </motion.div>

      {/* Indicadores de confiança */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Shield className="h-3 w-3 text-green-500" />
          <span>Pagamento seguro</span>
        </div>
        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3 text-blue-500" />
          <span>Ativação imediata</span>
        </div>
      </div>
    </div>
  );
};

export default ModernCartSummary;
