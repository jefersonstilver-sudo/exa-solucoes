
import React from 'react';
import { ClientOnly } from '@/components/ui/client-only';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';

interface PaymentContentProps {
  paymentData: any;
  orderId: string;
  refreshPaymentStatus: () => Promise<void>;
}

const PaymentContent = ({ 
  paymentData,
  orderId,
  refreshPaymentStatus
}: PaymentContentProps) => {
  return (
    <ClientOnly>
      <PaymentGateway
        orderId={orderId}
        totalAmount={paymentData.totalAmount}
        preferenceId={paymentData.preferenceId}
        pixData={paymentData.pixData}
        onRefreshStatus={refreshPaymentStatus}
      />
    </ClientOnly>
  );
};

export default PaymentContent;
