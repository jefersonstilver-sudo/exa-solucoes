
import { useState } from 'react';
import { toast } from 'sonner';

export const useCoupon = () => {
  const [couponCode, setCouponCode] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [couponValid, setCouponValid] = useState<boolean>(false);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const validateCoupon = () => {
    if (!couponCode.trim()) {
      setCouponMessage('Digite um cupom válido');
      setCouponValid(false);
      return;
    }

    setIsValidatingCoupon(true);
    setCouponMessage('');

    // Simulate coupon validation
    setTimeout(() => {
      // Mock validation logic
      if (couponCode.toLowerCase() === 'teste10') {
        setCouponValid(true);
        setCouponDiscount(10); // 10% discount
        setCouponMessage('Cupom aplicado com sucesso: 10% de desconto');
        toast.success('Cupom aplicado com sucesso!');
      } else if (couponCode.toLowerCase() === 'indexa20') {
        setCouponValid(true);
        setCouponDiscount(20); // 20% discount
        setCouponMessage('Cupom aplicado com sucesso: 20% de desconto');
        toast.success('Cupom aplicado com sucesso!');
      } else {
        setCouponValid(false);
        setCouponDiscount(0);
        setCouponMessage('Cupom inválido ou expirado');
        toast.error('Cupom inválido ou expirado');
      }
      
      setIsValidatingCoupon(false);
    }, 1000);
  };

  return {
    couponCode,
    setCouponCode,
    validateCoupon,
    isValidatingCoupon,
    couponMessage,
    couponValid,
    couponDiscount
  };
};
