
import React from 'react';

interface PixPaymentFooterProps {
  paymentId: string;
}

const PixPaymentFooter = ({ paymentId }: PixPaymentFooterProps) => {
  return (
    <div className="text-xs text-gray-500 text-center mt-4">
      <p>ID do Pagamento: {paymentId}</p>
      <p>Após o pagamento, você será automaticamente redirecionado para o próximo passo.</p>
    </div>
  );
};

export default PixPaymentFooter;
