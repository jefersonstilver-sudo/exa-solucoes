
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { handleMercadoPagoRedirect } from '@/services/mercadoPagoService';

interface CreditCardPaymentProps {
  preferenceId: string;
  totalAmount: number;
  isLoading: boolean;
}

const CreditCardPayment = ({ 
  preferenceId, 
  totalAmount,
  isLoading
}: CreditCardPaymentProps) => {
  
  // Efeito para redirecionar automaticamente ao MercadoPago quando o preferenceId estiver disponível
  useEffect(() => {
    if (preferenceId && !isLoading) {
      const redirectTimer = setTimeout(() => {
        handleMercadoPagoRedirect(preferenceId, 'credit_card');
      }, 2000); // Espera 2 segundos para mostrar informações e então redireciona
      
      return () => clearTimeout(redirectTimer);
    }
  }, [preferenceId, isLoading]);
  
  const handleManualRedirect = () => {
    if (preferenceId) {
      toast.info("Redirecionando para o MercadoPago...");
      handleMercadoPagoRedirect(preferenceId, 'credit_card');
    } else {
      toast.error("Aguarde, ainda estamos processando seu pagamento.");
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center space-x-4 w-full">
        <div className="bg-blue-100 p-3 rounded-full">
          <CreditCard className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-blue-900">Pagamento com Cartão de Crédito</h3>
          <p className="text-sm text-blue-700">
            Você está sendo redirecionado para o ambiente seguro do MercadoPago
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Total a pagar:</p>
        <p className="text-2xl font-bold">
          {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(totalAmount)}
        </p>
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <Button
          onClick={handleManualRedirect}
          disabled={isLoading || !preferenceId}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>Processando...</>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Pagar com MercadoPago
            </>
          )}
        </Button>
        
        <div className="flex items-center text-xs text-gray-500">
          <Lock className="h-3 w-3 mr-1" />
          Ambiente 100% seguro
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        <img src="https://www.mercadopago.com/org-img/Manual/checkout/logos/visa.gif" alt="Visa" className="h-8" />
        <img src="https://www.mercadopago.com/org-img/Manual/checkout/logos/mastercard.gif" alt="Mastercard" className="h-8" />
        <img src="https://www.mercadopago.com/org-img/Manual/checkout/logos/amex.gif" alt="Amex" className="h-8" />
        <img src="https://www.mercadopago.com/org-img/Manual/checkout/logos/elo.gif" alt="Elo" className="h-8" />
      </div>
    </div>
  );
};

export default CreditCardPayment;
