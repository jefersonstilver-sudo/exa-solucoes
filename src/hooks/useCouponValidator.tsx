
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useCouponValidator = () => {
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponValid, setCouponValid] = useState(false);
  const { toast } = useToast();

  // Function to validate coupon
  const validateCoupon = async (selectedPlan: number) => {
    if (!couponCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setCouponMessage('');
    setCouponValid(false);
    setCouponDiscount(0);
    setCouponId(null);
    
    try {
      // Call the Supabase RPC function to validate the coupon
      const { data, error } = await supabase.rpc('validate_cupom', {
        p_codigo: couponCode,
        p_meses: selectedPlan
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.valid) {
          setCouponDiscount(result.desconto_percentual);
          setCouponId(result.id);
          setCouponValid(true);
          setCouponMessage(result.message || 'Cupom aplicado com sucesso!');
          
          toast({
            title: "Cupom aplicado",
            description: `Desconto de ${result.desconto_percentual}% aplicado ao seu pedido!`,
          });
        } else {
          setCouponMessage(result.message || 'Este cupom não é válido para a sua compra.');
          toast({
            variant: "destructive",
            title: "Cupom inválido",
            description: result.message || 'Este cupom não é válido para a sua compra.',
          });
        }
      } else {
        setCouponMessage('Cupom não encontrado');
        toast({
          variant: "destructive",
          title: "Cupom não encontrado",
          description: "O código informado não corresponde a nenhum cupom ativo.",
        });
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      setCouponMessage('Erro ao validar cupom');
      toast({
        variant: "destructive",
        title: "Erro ao validar cupom",
        description: error.message,
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Reset the coupon
  const resetCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponId(null);
    setCouponMessage('');
    setCouponValid(false);
  };

  return {
    couponCode,
    setCouponCode,
    couponDiscount,
    couponId,
    isValidatingCoupon,
    couponMessage,
    couponValid,
    validateCoupon,
    resetCoupon
  };
};
