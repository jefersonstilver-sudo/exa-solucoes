import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import PixPaymentButton from '../summary/PixPaymentButton';
interface PaymentGatewayProps {
  orderId: string; totalAmount: number; preferenceId?: string;
  pixData?: { qrCodeBase64: string; qrCode: string; paymentId: string; status: string };
  onRefreshStatus?: () => Promise<void>; userId?: string;
}
export default function PaymentGateway({ orderId, totalAmount }: PaymentGatewayProps) {
  const navigate = useNavigate();
  return <div className="flex flex-col space-y-6">
    <Button variant="ghost" onClick={() => navigate('/checkout/resumo')} className="self-start"><ChevronLeft className="mr-2 h-4 w-4" />Voltar</Button>
    <PixPaymentButton totalAmount={totalAmount} onPaymentInitiate={async () => { navigate(`/pix-payment?pedido=${orderId}`); }} />
    <div className="text-sm text-muted-foreground">Pix · Asaas</div>
  </div>;
}
