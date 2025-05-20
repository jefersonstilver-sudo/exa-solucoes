
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';
import PaymentGateway from '@/components/checkout/payment/PaymentGateway';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  
  // Check authentication
  React.useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      // User is not authenticated, redirect to login
      toast.error("Usuário não autenticado");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);
  
  // Don't render payment gateway until we confirm user is logged in
  if (isSessionLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }
  
  if (!isLoggedIn) {
    return null; // Will be redirected by the effect above
  }
  
  return (
    <ClientOnly>
      <PaymentGateway
        orderId={orderId}
        totalAmount={paymentData.totalAmount}
        preferenceId={paymentData.preferenceId}
        pixData={paymentData.pixData}
        onRefreshStatus={refreshPaymentStatus}
        userId={user?.id}
      />
    </ClientOnly>
  );
};

export default PaymentContent;
