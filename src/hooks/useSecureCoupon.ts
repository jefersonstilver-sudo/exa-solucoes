import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CouponValidationResult {
  valid: boolean;
  error?: string;
  id?: string;
  codigo?: string;
  desconto_percentual?: number;
  tipo_desconto?: 'percentual' | 'valor_fixo' | 'preco_final';
  min_meses?: number;
  valor_minimo_pedido?: number;
  descricao?: string;
  preco_final?: number; // Valor final fixo quando tipo_desconto = 'preco_final'
}

interface CouponApplicationResult {
  success: boolean;
  error?: string;
  discount_percent?: number;
  coupon_id?: string;
}

export const useSecureCoupon = () => {
  const [loading, setLoading] = useState(false);

  const validateCoupon = async (
    codigo: string, 
    valorPedido: number = 0
  ): Promise<CouponValidationResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon_secure', {
        p_codigo: codigo,
        p_valor_pedido: valorPedido
      });

      if (error) {
        console.error('Erro ao validar cupom:', error);
        toast.error('Erro ao validar cupom');
        return { valid: false, error: error.message };
      }

      const result = data as unknown as CouponValidationResult;
      if (!result.valid) {
        toast.error(result.error || 'Cupom inválido');
        return result;
      }

      toast.success('Cupom válido!');
      return result;
      
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao validar cupom');
      return { valid: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (
    codigo: string, 
    pedidoId: string
  ): Promise<CouponApplicationResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('apply_coupon_secure', {
        p_codigo: codigo,
        p_pedido_id: pedidoId
      });

      if (error) {
        console.error('Erro ao aplicar cupom:', error);
        toast.error('Erro ao aplicar cupom');
        return { success: false, error: error.message };
      }

      const result = data as unknown as CouponApplicationResult;
      if (!result.success) {
        toast.error(result.error || 'Falha ao aplicar cupom');
        return result;
      }

      toast.success(`Cupom aplicado! Desconto de ${result.discount_percent}%`);
      return result;
      
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao aplicar cupom');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const monitorSecurity = async () => {
    try {
      const { data, error } = await supabase.rpc('monitor_coupon_security');
      
      if (error) {
        console.error('Erro ao monitorar segurança:', error);
        return null;
      }
      
      return data;
      
    } catch (error: any) {
      console.error('Erro inesperado no monitoramento:', error);
      return null;
    }
  };

  return {
    loading,
    validateCoupon,
    applyCoupon,
    monitorSecurity
  };
};