import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Panel } from '@/types/panel';
import { usePaymentValidator } from './flows/usePaymentValidator';
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
  couponCode?: string | null;  // Required for server-side price validation with coupons
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  handleClearCart: () => void;
  paymentMethod?: string;
  onPixGenerated?: (pixData: { qrCodeBase64: string; qrCodeText: string; pedidoId: string }) => void;
}

export const usePaymentFlow = () => {
  const navigate = useNavigate();
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  const { validateForPayment } = usePaymentValidator();
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
        couponCode: options.couponCode,  // Pass couponCode for server-side price validation
        startDate: options.startDate,
        endDate: options.endDate,
        paymentMethod: options.paymentMethod
      });
      
      const pedido = unwrapData(pedidoResult) as any;
      setCreatedOrderId(pedido.id);
      
      // Apenas PIX é processado aqui
      // Cartão de crédito é processado pelo modal via useCheckoutPro
      if (options.paymentMethod === 'pix') {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            pedido_id: pedido.id,
            payment_method: 'pix',
            total_amount: options.totalPrice
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
