
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ensureArray } from '@/utils/supabaseUtils';

interface CouponValidationResult {
  valid: boolean;
  message: string;
  couponId: string | null;
  discountPercent: number;
  categoria?: 'geral' | 'especial' | 'primeiro_pedido' | 'fidelidade' | 'promocional' | 'parceiro' | 'cortesia';
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

  // Carregar estado do cupom do localStorage
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
      }
    } catch (error) {
      console.error("Erro ao carregar cupom:", error);
    }
  }, []);

  // Salvar estado do cupom no localStorage
  const saveCouponState = useCallback((code: string, result: CouponValidationResult) => {
    try {
      const couponState = {
        couponCode: code,
        validationResult: result,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('appliedCoupon', JSON.stringify(couponState));
    } catch (error) {
      console.error("Erro ao salvar cupom:", error);
    }
  }, []);

  const validateCoupon = useCallback(async (code: string, orderValue: number, quantidadePredios: number = 0) => {
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
      console.log('[useCouponValidator] Validando cupom:', { code, orderValue, quantidadePredios });
      
      const { data: responseData, error } = await supabase
        .rpc('validate_coupon_secure', { 
          p_codigo: code,
          p_valor_pedido: orderValue || 0,
          p_quantidade_predios: quantidadePredios || 0
        });
      
      if (error) {
        console.error('[useCouponValidator] Erro RPC:', error);
        throw error;
      }
      
      console.log('[useCouponValidator] Resposta RPC:', responseData);
      
      if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
        const result = {
          valid: false,
          message: 'Cupom inválido ou expirado',
          couponId: null,
          discountPercent: 0
        };
        setValidationResult(result);
        saveCouponState(code, result);
        return false;
      }
      
      // Type assertion para garantir que responseData é um objeto
      const couponData = responseData as { 
        valid?: boolean; 
        error?: string; 
        id?: string; 
        desconto_percentual?: number;
        categoria?: 'geral' | 'especial' | 'primeiro_pedido' | 'fidelidade' | 'promocional' | 'parceiro' | 'cortesia';
      };
      
      const isValid = couponData.valid === true;
      
      // 🔑 CRITICAL: Salvar o código do cupom quando validação é bem-sucedida
      if (isValid) {
        setCouponCode(code);
        console.log('[useCouponValidator] ✅ Cupom válido - código salvo:', code);
      }
      
      const validationResult = {
        valid: isValid,
        message: isValid ? 'Cupom aplicado com sucesso!' : (couponData.error || 'Cupom inválido'),
        couponId: isValid ? (couponData.id || null) : null,
        discountPercent: isValid ? (couponData.desconto_percentual || 0) : 0,
        categoria: isValid ? couponData.categoria : undefined
      };
      
      console.log('[useCouponValidator] Resultado da validação:', validationResult);
      
      setValidationResult(validationResult);
      saveCouponState(code, validationResult);
      
      return isValid;
    } catch (error) {
      console.error('[useCouponValidator] Erro ao validar cupom:', error);
      
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
  }, []);

  const removeCoupon = useCallback(() => {
    setCouponCode('');
    const emptyResult = {
      valid: false,
      message: '',
      couponId: null,
      discountPercent: 0
    };
    setValidationResult(emptyResult);
    
    // Limpar do localStorage
    try {
      localStorage.removeItem('appliedCoupon');
    } catch (error) {
      console.error("Erro ao remover cupom:", error);
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
