
import { useState, useCallback, useEffect } from 'react';
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
  
  const [couponCode, setCouponCode] = useState<string>('');

  // CORREÇÃO: Carregar estado do cupom do localStorage
  useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        const parsed = JSON.parse(savedCoupon);
        setValidationResult(parsed.validationResult || {
          valid: false,
          message: '',
          couponId: null,
          discountPercent: 0
        });
        setCouponCode(parsed.couponCode || '');
        
        console.log("🎟️ [CouponValidator] Cupom carregado do localStorage:", {
          couponCode: parsed.couponCode,
          discount: parsed.validationResult?.discountPercent,
          valid: parsed.validationResult?.valid
        });
      }
    } catch (error) {
      console.error("❌ [CouponValidator] Erro ao carregar cupom:", error);
    }
  }, []);

  // CORREÇÃO: Salvar estado do cupom no localStorage
  const saveCouponState = useCallback((code: string, result: CouponValidationResult) => {
    try {
      const couponState = {
        couponCode: code,
        validationResult: result,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('appliedCoupon', JSON.stringify(couponState));
      console.log("🎟️ [CouponValidator] Estado do cupom salvo:", couponState);
    } catch (error) {
      console.error("❌ [CouponValidator] Erro ao salvar cupom:", error);
    }
  }, []);

  const validateCoupon = useCallback(async (code: string, selectedMonths: number) => {
    if (!code) {
      const result = {
        valid: false,
        message: 'Informe um código de cupom',
        couponId: null,
        discountPercent: 0
      };
      setValidationResult(result);
      return false;
    }
    
    setIsValidating(true);
    
    try {
      console.log("🎟️ [CouponValidator] Validando cupom:", { code, selectedMonths });
      
      const { data: responseData, error } = await supabase
        .rpc('validate_cupom', { 
          p_codigo: code,
          p_meses: selectedMonths
        });
      
      if (error) throw error;
      
      const resultsArray = ensureArray(responseData);
      
      if (resultsArray.length === 0) {
        const result = {
          valid: false,
          message: 'Cupom inválido',
          couponId: null,
          discountPercent: 0
        };
        setValidationResult(result);
        saveCouponState(code, result);
        return false;
      }
      
      const result = resultsArray[0] as any;
      
      const validationResult = {
        valid: result.valid === true,
        message: result.message || 'Cupom processado',
        couponId: result.valid === true ? result.id : null,
        discountPercent: result.valid === true ? result.desconto_percentual : 0
      };
      
      setValidationResult(validationResult);
      saveCouponState(code, validationResult);
      
      console.log("🎟️ [CouponValidator] Resultado da validação:", validationResult);
      
      return result.valid === true;
    } catch (error) {
      console.error('❌ [CouponValidator] Erro ao validar cupom:', error);
      
      const errorResult = {
        valid: false,
        message: 'Erro ao validar cupom. Tente novamente.',
        couponId: null,
        discountPercent: 0
      };
      
      setValidationResult(errorResult);
      saveCouponState(code, errorResult);
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [saveCouponState]);

  const applyCoupon = useCallback((code: string) => {
    setCouponCode(code);
    console.log("🎟️ [CouponValidator] Aplicando cupom:", code);
  }, []);

  const removeCoupon = useCallback(() => {
    console.log("🎟️ [CouponValidator] Removendo cupom");
    setCouponCode('');
    const emptyResult = {
      valid: false,
      message: '',
      couponId: null,
      discountPercent: 0
    };
    setValidationResult(emptyResult);
    
    // CORREÇÃO: Limpar do localStorage
    try {
      localStorage.removeItem('appliedCoupon');
      console.log("🎟️ [CouponValidator] Cupom removido do localStorage");
    } catch (error) {
      console.error("❌ [CouponValidator] Erro ao remover cupom:", error);
    }
  }, []);

  return {
    isValidating,
    validateCoupon,
    validationResult,
    applyCoupon,
    removeCoupon,
    
    // Valores derivados para compatibilidade
    couponCode,
    setCouponCode,
    couponDiscount: validationResult.discountPercent,
    couponId: validationResult.couponId,
    isValidatingCoupon: isValidating,
    couponMessage: validationResult.message,
    couponValid: validationResult.valid
  };
}
