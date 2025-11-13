import React from 'react';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, ShieldCheck, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PixPaymentButtonProps {
  totalAmount: number;
  onPaymentInitiate: () => Promise<void>;
  disabled?: boolean;
}

const PixPaymentButton = ({ 
  totalAmount, 
  onPaymentInitiate,
  disabled = false
}: PixPaymentButtonProps) => {
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate PIX discount (5%)
  const discountedAmount = totalAmount * 0.95;
  const discount = totalAmount - discountedAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* PIX Payment Header */}
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex items-center space-x-4">
        <div className="bg-primary/10 p-3 rounded-full">
          <QrCode className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground">Pagamento via PIX</h3>
          <p className="text-sm text-muted-foreground">
            Pagamento instantâneo e 5% de desconto
          </p>
        </div>
      </div>

      {/* Price Display with Discount */}
      <div className="bg-card p-4 rounded-lg border border-border">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor original:</span>
            <span className="text-sm line-through text-muted-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-600 dark:text-green-400">Desconto PIX (5%):</span>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              - {formatCurrency(discount)}
            </span>
          </div>
          <div className="h-px bg-border my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total a pagar:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(discountedAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <motion.div
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        <Button
          onClick={onPaymentInitiate}
          disabled={disabled}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {disabled ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-5 w-5" />
              Pagar com PIX
            </>
          )}
        </Button>
      </motion.div>

      {/* Security Info */}
      <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div className="flex flex-col items-center text-center space-y-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Seguro</span>
        </div>
        <div className="flex flex-col items-center text-center space-y-1">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span>Instantâneo</span>
        </div>
        <div className="flex flex-col items-center text-center space-y-1">
          <Lock className="h-4 w-4 text-primary" />
          <span>Criptografado</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Como funciona:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Clique no botão acima</li>
          <li>Escaneie o QR Code com seu banco</li>
          <li>Confirmação automática em segundos</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default PixPaymentButton;
