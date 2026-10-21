import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { verifyAsaasOrder } from '@/services/asaasPaymentService';
interface UseRealtimePaymentStatusProps { userId?: string; pedidoId?: string; onPaymentApproved?: () => void }
export const useRealtimePaymentStatus = ({ userId, pedidoId, onPaymentApproved }: UseRealtimePaymentStatusProps) => {
  const [isListening, setIsListening] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const notified = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!userId || !pedidoId) return;
    notified.current = false;
    let cancelled = false;
    const verify = async () => {
      try {
        const result = await verifyAsaasOrder(pedidoId);
        if (!cancelled && result.payment_approved && !notified.current) {
          notified.current = true; setShowSuccessOverlay(true); onPaymentApproved?.();
        }
      } catch { /* Failed queries never imply payment confirmation. */ }
    };
    setIsListening(true); verify();
    const channel = supabase.channel(`asaas-payment-${pedidoId}`).on('postgres_changes',
      { event: '*', schema: 'public', table: 'sofia_cobrancas', filter: `external_reference=eq.${pedidoId}` }, verify).subscribe();
    const interval = setInterval(verify, 60000);
    return () => { cancelled = true; clearInterval(interval); supabase.removeChannel(channel); setIsListening(false); };
  }, [userId, pedidoId, onPaymentApproved]);
  const handleContinueAfterSuccess = useCallback(() => { setShowSuccessOverlay(false); navigate('/anunciante/pedidos'); }, [navigate]);
  return { isListening, showSuccessOverlay, handleContinueAfterSuccess };
};
