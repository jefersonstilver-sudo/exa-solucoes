/**
 * Utilitário para monitoramento e correção de pagamentos duplicados
 * Sistema de proteção contra webhooks duplicados do MercadoPago
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuspiciousPayment {
  pedido_id: string;
  client_id: string;
  valor_total: number;
  status: string;
  created_at: string;
  payment_id: string;
  external_reference: string;
  suspicious_reason: string;
}

interface PaymentRevertResult {
  success: boolean;
  pedido_id?: string;
  previous_status?: string;
  new_status?: string;
  reason?: string;
  error?: string;
}

export class PaymentDuplicationMonitor {
  /**
   * Detecta pagamentos suspeitos de duplicação
   */
  static async detectSuspiciousPayments(): Promise<SuspiciousPayment[]> {
    try {
      console.log("🔍 [PaymentMonitor] Detectando pagamentos suspeitos...");
      
      const { data, error } = await supabase.rpc('detect_duplicate_payments');
      
      if (error) {
        console.error("❌ [PaymentMonitor] Erro ao detectar duplicatas:", error);
        throw error;
      }
      
      console.log("📊 [PaymentMonitor] Pagamentos suspeitos encontrados:", data?.length || 0);
      return data || [];
      
    } catch (error) {
      console.error("❌ [PaymentMonitor] Erro na detecção:", error);
      return [];
    }
  }

  /**
   * Reverte um pagamento suspeito (apenas super admins)
   */
  static async revertSuspiciousPayment(
    pedidoId: string, 
    reason: string = 'duplicate_payment_correction'
  ): Promise<PaymentRevertResult> {
    try {
      console.log("🔄 [PaymentMonitor] Revertendo pagamento:", { pedidoId, reason });
      
      const { data, error } = await supabase.rpc('revert_suspicious_payment', {
        p_pedido_id: pedidoId,
        p_reason: reason
      });
      
      if (error) {
        console.error("❌ [PaymentMonitor] Erro ao reverter:", error);
        return {
          success: false,
          error: error.message
        };
      }
      
      console.log("✅ [PaymentMonitor] Pagamento revertido:", data);
      
      // Cast data para o tipo correto com verificação de segurança
      const result = data as unknown as PaymentRevertResult;
      
      if (result?.success) {
        toast.success(`Pagamento revertido com sucesso: ${result.pedido_id}`);
      }
      
      return result;
      
    } catch (error: any) {
      console.error("❌ [PaymentMonitor] Erro na reversão:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Monitora e alerta sobre webhooks duplicados em tempo real
   */
  static async monitorWebhookDuplicates(): Promise<void> {
    try {
      // Buscar webhooks suspeitos das últimas 24 horas
      const { data: webhookLogs, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('origem', 'mercadopago-pix-completo')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error("❌ [PaymentMonitor] Erro ao monitorar webhooks:", error);
        return;
      }

      // Agrupar por payment_id para detectar duplicatas
      const paymentGroups = new Map<string, any[]>();
      
      webhookLogs?.forEach(log => {
        // Cast para acessar propriedades aninhadas do payload
        const payload = log.payload as any;
        const paymentId = payload?.data?.id || payload?.id;
        if (paymentId) {
          if (!paymentGroups.has(paymentId)) {
            paymentGroups.set(paymentId, []);
          }
          paymentGroups.get(paymentId)!.push(log);
        }
      });

      // Identificar duplicatas
      const duplicates = Array.from(paymentGroups.entries())
        .filter(([_, logs]) => logs.length > 1);

      if (duplicates.length > 0) {
        console.warn("⚠️ [PaymentMonitor] Webhooks duplicados detectados:", duplicates.length);
        
        duplicates.forEach(([paymentId, logs]) => {
          console.warn(`🔍 Payment ID ${paymentId}: ${logs.length} webhooks`);
        });
      }

    } catch (error) {
      console.error("❌ [PaymentMonitor] Erro no monitoramento:", error);
    }
  }

  /**
   * Gera relatório de segurança de pagamentos
   */
  static async generateSecurityReport(): Promise<{
    suspiciousPayments: SuspiciousPayment[];
    duplicateWebhooks: number;
    controlledPayments: number;
    recommendations: string[];
  }> {
    try {
      console.log("📊 [PaymentMonitor] Gerando relatório de segurança...");

      // 1. Pagamentos suspeitos
      const suspiciousPayments = await this.detectSuspiciousPayments();

      // 2. Contar payments controlados
      const { count: controlledPayments } = await supabase
        .from('payment_processing_control')
        .select('*', { count: 'exact', head: true });

      // 3. Monitorar webhooks duplicados
      await this.monitorWebhookDuplicates();

      // 4. Gerar recomendações
      const recommendations: string[] = [];
      
      if (suspiciousPayments.length > 0) {
        recommendations.push(`Revisar ${suspiciousPayments.length} pagamentos suspeitos`);
      }
      
      if (suspiciousPayments.filter(p => p.suspicious_reason === 'test_value_recent_payment').length > 5) {
        recommendations.push('Considerar implementar ambiente de testes separado');
      }

      if (controlledPayments === 0) {
        recommendations.push('Sistema de controle de duplicatas recém implementado - monitorar');
      }

      return {
        suspiciousPayments,
        duplicateWebhooks: 0, // Will be calculated in monitorWebhookDuplicates
        controlledPayments: controlledPayments || 0,
        recommendations
      };

    } catch (error) {
      console.error("❌ [PaymentMonitor] Erro ao gerar relatório:", error);
      return {
        suspiciousPayments: [],
        duplicateWebhooks: 0,
        controlledPayments: 0,
        recommendations: ['Erro ao gerar relatório - verificar logs']
      };
    }
  }
}

// Singleton para monitoramento contínuo
export const paymentDuplicationMonitor = new PaymentDuplicationMonitor();