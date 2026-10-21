import { useState, useEffect } from 'react';
import { generateOrderPix, verifyAsaasOrder } from '@/services/asaasPaymentService';
export interface PixPaymentData {
  qrCodeBase64?: string; qrCode?: string; paymentId?: string; status?: string;
  createdAt?: string; pedidoId?: string; valorTotal?: number;
}
export const usePixPayment = (pedidoId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pedidoId) { setError('ID do pedido não fornecido'); setIsLoading(false); return; }
    setIsLoading(true); setError(null); setPaymentData(null);
    generateOrderPix(pedidoId).then(data => {
      if (!cancelled) setPaymentData({ qrCodeBase64: data.qr_base64, qrCode: data.copia_cola, paymentId: data.payment_id, status: 'PENDING', pedidoId });
    }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [pedidoId]);
  const refreshPaymentStatus = async () => {
    if (!pedidoId) return;
    try {
      const data = await verifyAsaasOrder(pedidoId);
      if (!data.payment_found) throw new Error('Cobrança Asaas não localizada');
      setPaymentData(prev => ({ ...prev, status: data.payment_approved ? 'approved' : data.payment_status, valorTotal: data.payment_amount }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Consulta Asaas indisponível'); }
  };
  return { isLoading, error, paymentData, refreshPaymentStatus };
};
