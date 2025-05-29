
import { supabase } from '@/integrations/supabase/client';

export const contractExpirationService = {
  /**
   * Executa verificação manual de contratos expirados
   */
  async checkExpiredContracts() {
    try {
      console.log('🔍 [CONTRACT_SERVICE] Executando verificação de contratos expirados...');
      
      const { data, error } = await supabase.rpc('update_expired_contracts');
      
      if (error) {
        console.error('❌ [CONTRACT_SERVICE] Erro na verificação:', error);
        throw error;
      }
      
      console.log('✅ [CONTRACT_SERVICE] Verificação concluída:', data);
      return data;
    } catch (error) {
      console.error('💥 [CONTRACT_SERVICE] Erro crítico:', error);
      throw error;
    }
  },

  /**
   * Verifica se um contrato específico está ativo
   */
  async isContractActive(pedidoId: string): Promise<boolean> {
    try {
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('data_fim, status')
        .eq('id', pedidoId)
        .single();

      if (error || !pedido) {
        console.error('❌ [CONTRACT_SERVICE] Erro ao buscar pedido:', error);
        return false;
      }

      const { data_fim, status } = pedido;
      
      // Se já está marcado como expirado
      if (status === 'expirado' || status === 'cancelado') {
        return false;
      }

      // Se tem data de fim e já passou
      if (data_fim && new Date(data_fim) < new Date()) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 [CONTRACT_SERVICE] Erro ao verificar contrato:', error);
      return false;
    }
  },

  /**
   * Obtém todos os contratos que estão próximos da expiração
   */
  async getContractsNearExpiration(daysAhead: number = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          id,
          data_fim,
          valor_total,
          client_id,
          status
        `)
        .gte('data_fim', new Date().toISOString().split('T')[0])
        .lte('data_fim', futureDate.toISOString().split('T')[0])
        .not('status', 'in', '(expirado,cancelado)');

      if (error) {
        console.error('❌ [CONTRACT_SERVICE] Erro ao buscar contratos próximos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('💥 [CONTRACT_SERVICE] Erro ao buscar contratos próximos:', error);
      return [];
    }
  }
};
