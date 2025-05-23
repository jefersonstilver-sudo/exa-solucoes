
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureArray } from '@/utils/supabaseUtils';

export function useCouponValidator() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    couponId: string | null;
    discountPercent: number;
  }>({
    valid: false,
    message: '',
    couponId: null,
    discountPercent: 0
  });

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
      const { data, error } = await supabase
        .rpc('validate_cupom', { 
          p_codigo: code,
          p_meses: selectedMonths
        });
      
      if (error) throw error;
      
      // Ensure data is an array
      const resultsArray = ensureArray(data);
      
      if (resultsArray.length === 0) {
        setValidationResult({
          valid: false,
          message: 'Cupom inválido',
          couponId: null,
          discountPercent: 0
        });
        return false;
      }
      
      const result = resultsArray[0];
      
      setValidationResult({
        valid: result.valid,
        message: result.message,
        couponId: result.valid ? result.id : null,
        discountPercent: result.valid ? result.desconto_percentual : 0
      });
      
      return result.valid;
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
    validationResult
  };
}
