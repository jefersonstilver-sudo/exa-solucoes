import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Percent, Gift, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CouponInfo {
  id: string;
  codigo: string;
  desconto_percentual: number;
  descricao?: string;
  categoria: string;
  min_meses: number;
  valor_minimo_pedido?: number;
}

interface CouponInfoDisplayProps {
  cupomId?: string;
  valorOriginal?: number;
  className?: string;
  showDetails?: boolean;
}

export const CouponInfoDisplay: React.FC<CouponInfoDisplayProps> = ({ 
  cupomId, 
  valorOriginal = 0,
  className = "",
  showDetails = true 
}) => {
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCouponInfo = async () => {
      if (!cupomId) {
        console.log('🎫 [CouponInfoDisplay] Sem cupom ID');
        setCouponInfo(null);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [CouponInfoDisplay] Buscando cupom:', cupomId);
        
        const { data, error } = await supabase
          .from('cupons')
          .select('id, codigo, desconto_percentual, descricao, categoria, min_meses, valor_minimo_pedido')
          .eq('id', cupomId)
          .single();

        if (error) {
          console.error('❌ [CouponInfoDisplay] Erro ao buscar cupom:', error);
          setCouponInfo(null);
          return;
        }

        if (!data) {
          console.warn('⚠️ [CouponInfoDisplay] Cupom não encontrado no banco:', cupomId);
          setCouponInfo(null);
          return;
        }

        console.log('✅ [CouponInfoDisplay] Cupom encontrado:', data);
        setCouponInfo(data);
      } catch (error) {
        console.error('💥 [CouponInfoDisplay] Erro ao carregar informações do cupom:', error);
        setCouponInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCouponInfo();
  }, [cupomId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDiscount = () => {
    if (!couponInfo || !valorOriginal) return 0;
    const valorComDesconto = valorOriginal / (1 - couponInfo.desconto_percentual / 100);
    const desconto = valorComDesconto - valorOriginal;
    return desconto;
  };

  const getCategoryColor = (categoria: string) => {
    const categoryColors: Record<string, string> = {
      'promocional': 'bg-red-100 text-red-800 border-red-300',
      'fidelidade': 'bg-blue-100 text-blue-800 border-blue-300',
      'especial': 'bg-purple-100 text-purple-800 border-purple-300',
      'geral': 'bg-green-100 text-green-800 border-green-300'
    };
    return categoryColors[categoria] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (!cupomId) return null;

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Gift className="h-4 w-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Carregando cupom...</span>
      </div>
    );
  }

  if (!couponInfo) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Gift className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">Cupom não encontrado</span>
      </div>
    );
  }

  const discountAmount = calculateDiscount();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Badge principal do cupom */}
      <div className="flex items-center space-x-2">
        <Gift className="h-5 w-5 text-green-600" />
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold">
            🎯 {couponInfo.codigo}
          </Badge>
          <Badge className={getCategoryColor(couponInfo.categoria)}>
            {couponInfo.categoria.charAt(0).toUpperCase() + couponInfo.categoria.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Informações do desconto */}
      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <Percent className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Desconto de {couponInfo.desconto_percentual}%
          </span>
        </div>
        {discountAmount > 0 && (
          <span className="text-green-700 font-bold">
            -{formatCurrency(discountAmount)}
          </span>
        )}
      </div>

      {/* Detalhes adicionais */}
      {showDetails && (
        <div className="space-y-2 text-sm text-gray-600">
          {couponInfo.descricao && (
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span>{couponInfo.descricao}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {couponInfo.min_meses > 1 && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-orange-500" />
                <span>Mín. {couponInfo.min_meses} meses</span>
              </div>
            )}
            
            {couponInfo.valor_minimo_pedido && couponInfo.valor_minimo_pedido > 0 && (
              <div className="flex items-center space-x-1">
                <span>Pedido mín. {formatCurrency(couponInfo.valor_minimo_pedido)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};