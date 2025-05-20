
import React from 'react';
import BackButton from '@/components/checkout/navigation/BackButton';
import ContinueButton from '@/components/checkout/navigation/ContinueButton';
import PixPaymentButton from '@/components/checkout/navigation/PixPaymentButton';
import TestPaymentButton from '@/components/checkout/navigation/TestPaymentButton';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isNavigating: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
  paymentMethod?: string;
  onTestPayment?: () => void; // New prop for test payment button
}

const CheckoutNavigation = ({ 
  onBack, 
  onNext, 
  isBackToStore, 
  isNextEnabled, 
  isCreatingPayment, 
  isNavigating,
  isPaymentStep,
  totalPrice = 0,
  paymentMethod = 'credit_card',
  onTestPayment
}: CheckoutNavigationProps) => {
  // Determine which next button to show based on current step and payment method
  const renderNextButton = () => {
    const isLoading = isCreatingPayment || isNavigating;
    const isDisabled = !isNextEnabled || isLoading;
    
    // When on payment step and using PIX, show a specific pay button
    if (isPaymentStep && paymentMethod === 'pix') {
      return (
        <div className="flex space-x-2">
          {onTestPayment && (
            <TestPaymentButton 
              onClick={onTestPayment}
              isDisabled={isDisabled}
            />
          )}
          <PixPaymentButton
            onClick={onNext}
            isDisabled={isDisabled}
            isLoading={isLoading}
            totalPrice={totalPrice}
          />
        </div>
      );
    }

    // Default continue button with optional test payment button
    return (
      <div className="flex space-x-2">
        {isPaymentStep && onTestPayment && (
          <TestPaymentButton 
            onClick={onTestPayment}
            isDisabled={isDisabled}
          />
        )}
        <ContinueButton 
          onClick={onNext}
          isDisabled={isDisabled}
          isLoading={isLoading}
        />
      </div>
    );
  };

  return (
    <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
      <BackButton 
        onClick={onBack} 
        isBackToStore={isBackToStore} 
      />
      
      {renderNextButton()}
    </div>
  );
};

export default CheckoutNavigation;
