
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import CheckoutLoadingState from '@/components/checkout/CheckoutLoadingState';
import CheckoutAuthGuard from '@/components/checkout/CheckoutAuthGuard';
import CheckoutContent from '@/components/checkout/CheckoutContent';
import MobilePixQrCode from '@/components/checkout/payment/MobilePixQrCode';
import { useCheckoutPixHandler } from '@/components/checkout/CheckoutPixHandler';

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  const [totalAmount, setTotalAmount] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPixDialog, setShowPixDialog] = useState(false);
  const [pixData, setPixData] = useState<{
    pix_url?: string;
    pix_base64?: string;
  }>({});
  
  const orderId = searchParams.get('id') || searchParams.get('pedido');
  
  // Calculate total amount from cart
  useEffect(() => {
    try {
      const cartItems = JSON.parse(localStorage.getItem('panelCart') || '[]');
      const total = cartItems.reduce((sum: number, item: any) => {
        const price = item.panel?.buildings?.basePrice || item.price || 250;
        return sum + price;
      }, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("[Checkout] Error calculating total:", error);
      setTotalAmount(0);
    }
  }, []);

  const { sendPixWebhook } = useCheckoutPixHandler({
    user,
    totalAmount,
    setIsProcessingPayment,
    setPixData,
    setShowPixDialog
  });

  const handleBack = () => {
    navigate('/checkout/resumo');
  };

  const handlePixPayment = () => {
    if (!acceptTerms) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }
    sendPixWebhook();
  };

  const handleClosePixDialog = () => {
    setShowPixDialog(false);
    setPixData({});
  };

  if (isSessionLoading) {
    return <CheckoutLoadingState />;
  }

  const pixAmount = totalAmount * 0.95; // 5% discount

  return (
    <Layout>
      <CheckoutAuthGuard
        isLoggedIn={isLoggedIn}
        isSessionLoading={isSessionLoading}
        userId={user?.id}
      >
        <CheckoutContent
          totalAmount={totalAmount}
          acceptTerms={acceptTerms}
          setAcceptTerms={setAcceptTerms}
          isProcessingPayment={isProcessingPayment}
          onPixPayment={handlePixPayment}
          onBack={handleBack}
        />

        {/* Mobile PIX QR Code Dialog */}
        <MobilePixQrCode
          isOpen={showPixDialog}
          onClose={handleClosePixDialog}
          qrCodeBase64={pixData.pix_base64}
          qrCodeText={pixData.pix_url}
          amount={pixAmount}
          onRefresh={() => {
            handleClosePixDialog();
            sendPixWebhook();
          }}
          isRefreshing={isProcessingPayment}
        />
      </CheckoutAuthGuard>
    </Layout>
  );
};

export default Checkout;
