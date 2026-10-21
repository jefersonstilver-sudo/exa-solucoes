import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import { Panel } from '@/types/panel';
import { usePaymentValidator } from './flows/usePaymentValidator';
import { useOrderCreation } from './useOrderCreation';
import { unwrapData } from '@/utils/supabaseUtils';
import { generateOrderPix } from '@/services/asaasPaymentService';

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
  onPixGenerated?: (pixData: { 
    qrCodeBase64: string; 
    qrCodeText: string; 
    pedidoId: string;
    isSubscription?: boolean;
    valorMensal?: number;
    valorTotal?: number;
    totalMeses?: number;
    infoMessage?: string;
  }) => void;
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
      
      if (options.paymentMethod && options.paymentMethod !== 'pix') throw new Error('Selecione Pix Asaas');
      const pedidoResult = createdOrderId ? { id: createdOrderId } : await createPaymentOrder({
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
      if (!pedido?.id) throw new Error('Pedido não retornado');
      setCreatedOrderId(pedido.id);
      const data = await generateOrderPix(pedido.id, options.sessionUser);
      options.handleClearCart();
      options.onPixGenerated?.({ qrCodeBase64: data.qr_base64, qrCodeText: data.copia_cola, pedidoId: pedido.id });
      sonnerToast.success('Cobrança Pix Asaas criada');
      if (!options.onPixGenerated) navigate(`/pix-payment?pedido=${pedido.id}`);
      return { success: true, pedidoId: pedido.id, pixData: { qrCodeBase64: data.qr_base64, qrCode: data.copia_cola, paymentId: data.payment_id, status: 'PENDING' } };
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
