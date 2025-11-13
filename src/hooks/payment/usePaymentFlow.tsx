
import { useState, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Panel } from '@/types/panel';
import { usePaymentValidator } from './flows/usePaymentValidator';
import { useStripeCheckout } from './useStripeCheckout';
import { useOrderCreation } from './useOrderCreation';
import { unwrapData } from '@/utils/supabaseUtils';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ProcessPaymentOptions {
  totalPrice: number;
  selectedPlan: number;
  cartItems: CartItem[];
  startDate: Date;
  endDate: Date;
  couponId: string | null;
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  handleClearCart: () => void;
  paymentMethod?: string;
  onPixGenerated?: (pixData: { qrCodeBase64: string; qrCodeText: string; pedidoId: string }) => void;
}

export const usePaymentFlow = () => {
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  const { validateForPayment } = usePaymentValidator();
  const { createCheckoutSession } = useStripeCheckout();
  const { createPaymentOrder } = useOrderCreation();

  const processPayment = async (options: ProcessPaymentOptions) => {
    if (processingPaymentRef.current) return;
    
    processingPaymentRef.current = true;
    setIsCreatingPayment(true);
    
    try {
      const isValid = validateForPayment({
        acceptTerms: options.acceptTerms,
        unavailablePanels: options.unavailablePanels,
        sessionUser: options.sessionUser,
        isSDKLoaded: true,
        cartItems: options.cartItems
      });
      
      if (!isValid) return;
      
      const pedidoResult = await createPaymentOrder({
        sessionUser: options.sessionUser,
        cartItems: options.cartItems,
        selectedPlan: options.selectedPlan,
        totalPrice: options.totalPrice,
        couponId: options.couponId,
        startDate: options.startDate,
        endDate: options.endDate
      });
      
      const pedido = unwrapData(pedidoResult) as any;
      setCreatedOrderId(pedido.id);
      
      if (options.paymentMethod === 'pix') {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            pedido_id: pedido.id,
            payment_method: 'pix',
            total_amount: options.totalPrice,
            user_id: options.sessionUser.id
          }
        });
        
        if (error) throw error;
        
        options.handleClearCart();
        sonnerToast.success("QR Code PIX gerado!");
        
        if (options.onPixGenerated && data) {
          options.onPixGenerated({
            qrCodeBase64: data.qrCodeBase64 || '',
            qrCodeText: data.qrCode || '',
            pedidoId: pedido.id
          });
        }
      } else {
        const { url } = await createCheckoutSession(pedido.id);
        options.handleClearCart();
        window.location.href = url;
      }
      
      return { success: true, pedidoId: pedido.id };
    } catch (error: any) {
      sonnerToast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
    }
  };

  return { isCreatingPayment, processPayment, createdOrderId };
};
