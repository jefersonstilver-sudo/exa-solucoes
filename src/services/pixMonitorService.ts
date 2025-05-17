
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PixPaymentStatus {
  paymentId: string;
  status: string;
  pedidoId: string;
}

// Define a type for the payment log data structure
interface PaymentLogData {
  payment_method?: string;
  preference_id?: string;
  payment_id?: string;
  payment_status?: string;
  pix_data?: {
    qr_code_base64?: string;
    qr_code?: string;
  };
}

/**
 * Classe para monitorar pagamentos PIX em background
 */
export class PixMonitor {
  private intervalId: number | null = null;
  private pedidoId: string;
  private paymentId: string;
  private onStatusChange: (status: string) => void;
  private checkInterval: number;
  private maxAttempts: number;
  private attempts: number;

  constructor({
    pedidoId,
    paymentId,
    onStatusChange,
    checkInterval = 8000, // Verificar a cada 8 segundos
    maxAttempts = 45 // ~6 minutos de monitoramento
  }: {
    pedidoId: string;
    paymentId: string;
    onStatusChange: (status: string) => void;
    checkInterval?: number;
    maxAttempts?: number;
  }) {
    this.pedidoId = pedidoId;
    this.paymentId = paymentId;
    this.onStatusChange = onStatusChange;
    this.checkInterval = checkInterval;
    this.maxAttempts = maxAttempts;
    this.attempts = 0;

    // Log de inicialização
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Monitor PIX inicializado para pedido: ${pedidoId}`,
      { pedidoId, paymentId }
    );
  }

  /**
   * Inicia o monitoramento do pagamento
   */
  public start(): void {
    if (this.intervalId) {
      this.stop();
    }

    // Verificação imediata
    this.checkPaymentStatus();

    // Configura a verificação periódica
    this.intervalId = window.setInterval(() => {
      this.checkPaymentStatus();
    }, this.checkInterval);

    console.log(`[PixMonitor] Monitoramento iniciado para pedido: ${this.pedidoId}`);
  }

  /**
   * Para o monitoramento
   */
  public stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[PixMonitor] Monitoramento interrompido para pedido: ${this.pedidoId}`);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Monitor PIX finalizado para pedido: ${this.pedidoId}`,
        { pedidoId: this.pedidoId, attempts: this.attempts }
      );
    }
  }

  /**
   * Verifica o status do pagamento
   */
  private async checkPaymentStatus(): Promise<void> {
    try {
      this.attempts++;
      console.log(`[PixMonitor] Verificando status (${this.attempts}/${this.maxAttempts})`);

      // Consulta o status do pagamento no banco de dados
      const { data, error } = await supabase
        .from('pedidos')
        .select('log_pagamento')
        .eq('id', this.pedidoId)
        .single();

      if (error) {
        console.error(`[PixMonitor] Erro ao verificar status:`, error);
        return;
      }

      if (!data || !data.log_pagamento) {
        console.warn(`[PixMonitor] Dados de pagamento não encontrados`);
        return;
      }

      const paymentLog = data.log_pagamento as PaymentLogData;
      const currentStatus = paymentLog.payment_status;
      
      console.log(`[PixMonitor] Status atual: ${currentStatus}`);

      // Notifica mudanças de status
      if (currentStatus) {
        this.onStatusChange(currentStatus);
      }

      // Para o monitoramento quando o pagamento for aprovado ou rejeitado
      if (['approved', 'rejected'].includes(currentStatus || '') || this.attempts >= this.maxAttempts) {
        if (currentStatus === 'approved') {
          toast.success("Pagamento aprovado! Redirecionando...");
        } else if (currentStatus === 'rejected') {
          toast.error("Pagamento rejeitado");
        } else if (this.attempts >= this.maxAttempts) {
          toast.info("Tempo de monitoramento excedido");
        }
        
        this.stop();
      }
    } catch (err) {
      console.error(`[PixMonitor] Erro ao verificar status:`, err);
      
      // Loga o erro
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao verificar status PIX: ${err}`,
        { pedidoId: this.pedidoId, error: String(err) }
      );
      
      // Para o monitoramento após muitas tentativas
      if (this.attempts >= this.maxAttempts) {
        this.stop();
      }
    }
  }

  /**
   * Verifica manualmente o status (usado pelo botão de atualizar)
   */
  public async manualCheck(): Promise<void> {
    try {
      console.log(`[PixMonitor] Verificação manual solicitada`);
      await this.checkPaymentStatus();
    } catch (err) {
      console.error(`[PixMonitor] Erro na verificação manual:`, err);
      toast.error("Erro ao verificar status do pagamento");
    }
  }
}

/**
 * Hook para usar o monitor de PIX
 */
export const usePixMonitor = ({
  pedidoId,
  paymentId,
  onStatusChange
}: {
  pedidoId: string;
  paymentId: string;
  onStatusChange: (status: string) => void;
}): {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkNow: () => Promise<void>;
} => {
  let monitor: PixMonitor | null = null;
  
  const startMonitoring = () => {
    if (!monitor && pedidoId && paymentId) {
      monitor = new PixMonitor({
        pedidoId,
        paymentId,
        onStatusChange
      });
      monitor.start();
    }
  };
  
  const stopMonitoring = () => {
    if (monitor) {
      monitor.stop();
      monitor = null;
    }
  };
  
  const checkNow = async () => {
    if (monitor) {
      await monitor.manualCheck();
    } else if (pedidoId && paymentId) {
      // Se o monitor não estiver ativo, cria temporariamente
      const tempMonitor = new PixMonitor({
        pedidoId,
        paymentId,
        onStatusChange
      });
      await tempMonitor.manualCheck();
    }
  };
  
  return {
    startMonitoring,
    stopMonitoring,
    checkNow
  };
};
