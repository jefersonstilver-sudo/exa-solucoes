
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureArray } from '@/utils/supabaseUtils';

interface CouponValidationResult {
  valid: boolean;
  message: string;
  couponId: string | null;
  discountPercent: number;
}

export function useCouponValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<CouponValidationResult>({
    valid: false,
    message: '',
    couponId: null,
    discountPercent: 0
  });
  
  // For compatibility with existing code
  const [couponCode, setCouponCode] = useState<string>('');
  const couponDiscount = validationResult.discountPercent;
  const couponId = validationResult.couponId;
  const isValidatingCoupon = isValidating;
  const couponMessage = validationResult.message;
  const couponValid = validationResult.valid;

  const validateCoupon = useCallback(async (code: string, selectedMonths: number) => {
    if (!code) {
      setValidationResult({
        valid: false,
        message: 'Informe um código de cupom',
        couponId: null,
        discountPercent: 0
      });
      return false;
    }
    
    setIsValidating(true);
    
    try {
      const { data: responseData, error } = await supabase
        .rpc('validate_cupom', { 
          p_codigo: code,
          p_meses: selectedMonths
        });
      
      if (error) throw error;
      
      // Ensure data is an array
      const resultsArray = ensureArray(responseData);
      
      if (resultsArray.length === 0) {
        setValidationResult({
          valid: false,
          message: 'Cupom inválido',
          couponId: null,
          discountPercent: 0
        });
        return false;
      }
      
      // Type assertion for safer access
      const result = resultsArray[0] as any;
      
      setValidationResult({
        valid: result.valid === true,
        message: result.message || 'Cupom processado',
        couponId: result.valid === true ? result.id : null,
        discountPercent: result.valid === true ? result.desconto_percentual : 0
      });
      
      return result.valid === true;
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      
      setValidationResult({
        valid: false,
        message: 'Erro ao validar cupom. Tente novamente.',
        couponId: null,
        discountPercent: 0
      });
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    isValidating,
    validateCoupon,
    validationResult,
    // Additional exported values for backward compatibility
    couponCode,
    setCouponCode,
    couponDiscount,
    couponId,
    isValidatingCoupon,
    couponMessage,
    couponValid
  };
}
