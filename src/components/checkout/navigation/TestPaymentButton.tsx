
import React from 'react';
import { Button } from '@/components/ui/button';

interface TestPaymentButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
}

const TestPaymentButton = ({ onClick, isDisabled = false }: TestPaymentButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="bg-purple-600 hover:bg-purple-700 text-white"
    >
      Pagar Teste
    </Button>
  );
};

export default TestPaymentButton;
