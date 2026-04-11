
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock } from 'lucide-react';

interface CreditCardPaymentProps {
  totalAmount: number;
  onPaymentInitiate: () => Promise<void>;
  isLoading: boolean;
}

const CreditCardPayment = ({ 
  totalAmount,
  onPaymentInitiate,
  isLoading
}: CreditCardPaymentProps) => {
  
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex items-center space-x-4 w-full">
        <div className="bg-primary/10 p-3 rounded-full">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-foreground">Pagamento com Cartão de Crédito</h3>
          <p className="text-sm text-muted-foreground">
            Você será redirecionado para o checkout seguro
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Total a pagar:</p>
        <p className="text-2xl font-bold text-foreground">
          {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(totalAmount)}
        </p>
      </div>
      
      <div className="flex flex-col items-center space-y-2 w-full">
        <Button
          onClick={onPaymentInitiate}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>Processando...</>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar com Cartão
            </>
          )}
        </Button>
        
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Checkout seguro via ASAAS</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 opacity-70">
        <div className="text-xs text-muted-foreground">
          Aceitamos: Visa, Mastercard, Amex, Elo e mais
        </div>
      </div>
    </div>
  );
};

export default CreditCardPayment;
