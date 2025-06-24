
import { useState, useEffect } from "react";
import PaymentMethodOption from "./PaymentMethodOption";
import { formatCurrency } from '@/utils/priceUtils';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PaymentMethodsProps {
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
  totalPrice: number;
  pedidoId?: string;
}

const PaymentMethods = ({ selectedMethod, setSelectedMethod, totalPrice, pedidoId }: PaymentMethodsProps) => {
  const navigate = useNavigate();
  const [pixTotal, setPixTotal] = useState<number>(totalPrice);
  const [isProcessingPix, setIsProcessingPix] = useState(false);
  
  // Force PIX as the only available method
  useEffect(() => {
    console.log("[PaymentMethods] Forcing PIX as default method");
    if (selectedMethod !== 'pix') {
      setSelectedMethod('pix');
    }
  }, [selectedMethod, setSelectedMethod]);
  
  // Calculate PIX discount (5% off for PIX payments)
  useEffect(() => {
    const pixDiscount = 0.05; // 5%
    setPixTotal(totalPrice * (1 - pixDiscount));
  }, [totalPrice]);

  // Function to handle PIX payment
  const handlePixPayment = async () => {
    if (!pedidoId) {
      toast.error("ID do pedido não encontrado");
      return;
    }

    setIsProcessingPix(true);
    
    try {
      console.log("💳 [PaymentMethods] Processando PIX para pedido:", pedidoId);
      
      // Call edge function to process PIX payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          pedido_id: pedidoId,
          payment_method: 'pix',
          total_amount: pixTotal,
          user_email: 'cliente@exemplo.com' // This should come from user session
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao processar pagamento PIX');
      }

      console.log("✅ [PaymentMethods] PIX processado com sucesso:", data);

      // Navigate to PIX payment page
      navigate(`/pix-payment?pedido=${pedidoId}`);
      
      toast.success("PIX gerado com sucesso! Redirecionando...");

    } catch (error: any) {
      console.error("❌ [PaymentMethods] Erro ao processar PIX:", error);
      toast.error(`Erro ao processar PIX: ${error.message}`);
    } finally {
      setIsProcessingPix(false);
    }
  };

  // Function to handle method selection
  const handleMethodSelect = async (method: string) => {
    if (method !== 'pix') {
      console.log("[PaymentMethods] Credit card temporarily disabled");
      toast.info("Pagamento com cartão estará disponível em breve!");
      return;
    }
    
    setSelectedMethod(method);
    
    console.log("[PaymentMethods] PIX method selected, processing...");
    
    // Log the payment method selection
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${method}`,
      { method, totalPrice, pixTotal }
    );

    // Process PIX payment immediately
    await handlePixPayment();
  };
  
  // Payment method options - Only PIX available
  const paymentMethods = [
    { 
      id: "pix", 
      name: "PIX", 
      description: `💰 Pagamento instantâneo com 5% de desconto — Total: ${formatCurrency(pixTotal)}`, 
      icon: <svg 
        viewBox="0 0 512 512" 
        className="h-6 w-6" 
        fill="currentColor"
      >
        <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
      </svg>,
      installments: false,
      totalValue: pixTotal,
      highlight: true,
      isProcessing: isProcessingPix
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          💳 Método de Pagamento Disponível
        </h3>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
                ${selectedMethod === method.id 
                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-lg' 
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`
                    p-3 rounded-full 
                    ${selectedMethod === method.id ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {method.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-800">{method.name}</h4>
                    <p className="text-green-600 font-medium">{method.description}</p>
                  </div>
                </div>
                
                {method.isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-green-600 font-medium">Processando...</span>
                  </div>
                ) : (
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selectedMethod === method.id 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedMethod === method.id && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                )}
              </div>

              {selectedMethod === method.id && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium text-center">
                    ✅ PIX selecionado! Processando pagamento...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Temporary notice about credit card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-blue-700 font-medium">
            💳 Pagamento com cartão de crédito estará disponível em breve!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
