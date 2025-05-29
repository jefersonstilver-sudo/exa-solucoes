
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContractStatus {
  isActive: boolean;
  isExpired: boolean;
  isNearExpiration: boolean;
  daysRemaining: number;
  expiryDate: string | null;
}

export const useContractStatus = (orderId: string) => {
  const [contractStatus, setContractStatus] = useState<ContractStatus>({
    isActive: false,
    isExpired: false,
    isNearExpiration: false,
    daysRemaining: 0,
    expiryDate: null
  });
  const [loading, setLoading] = useState(true);

  const checkContractStatus = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 [CONTRACT] Verificando status do contrato:', orderId);
      
      const { data: orderData, error } = await supabase
        .from('pedidos')
        .select('data_fim, status')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ [CONTRACT] Erro ao buscar dados do pedido:', error);
        setLoading(false);
        return;
      }

      if (!orderData) {
        console.log('⚠️ [CONTRACT] Pedido não encontrado');
        setLoading(false);
        return;
      }

      const { data_fim, status } = orderData;
      const today = new Date();
      const expiryDate = data_fim ? new Date(data_fim) : null;

      let contractStatus: ContractStatus = {
        isActive: false,
        isExpired: false,
        isNearExpiration: false,
        daysRemaining: 0,
        expiryDate: data_fim
      };

      if (expiryDate) {
        const timeDiff = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

        contractStatus.daysRemaining = daysRemaining;

        // Verificar se expirou
        if (daysRemaining < 0 || status === 'expirado') {
          contractStatus.isExpired = true;
          contractStatus.isActive = false;
          console.log('⏰ [CONTRACT] Contrato EXPIRADO');
        } else {
          contractStatus.isActive = true;
          contractStatus.isExpired = false;

          // Verificar se está próximo da expiração (7 dias)
          if (daysRemaining <= 7) {
            contractStatus.isNearExpiration = true;
            console.log(`⚠️ [CONTRACT] Contrato próximo da expiração: ${daysRemaining} dias`);
          }
        }
      } else {
        // Sem data de fim definida, considerar ativo
        contractStatus.isActive = true;
      }

      console.log('📊 [CONTRACT] Status calculado:', contractStatus);
      setContractStatus(contractStatus);

    } catch (error) {
      console.error('💥 [CONTRACT] Erro crítico ao verificar status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkContractStatus();
  }, [orderId]);

  return {
    contractStatus,
    loading,
    refreshStatus: checkContractStatus
  };
};
