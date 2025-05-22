
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PaymentLogData, PixMonitorOptions } from './pixTypes';

/**
 * Class for monitoring PIX payments in the background
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
    checkInterval = 8000, // Check every 8 seconds
    maxAttempts = 45 // ~6 minutes of monitoring
  }: PixMonitorOptions) {
    this.pedidoId = pedidoId;
    this.paymentId = paymentId;
    this.onStatusChange = onStatusChange;
    this.checkInterval = checkInterval;
    this.maxAttempts = maxAttempts;
    this.attempts = 0;

    // Initialization log
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `PIX Monitor initialized for order: ${pedidoId}`,
      { pedidoId, paymentId }
    );
  }

  /**
   * Start payment monitoring
   */
  public start(): void {
    if (this.intervalId) {
      this.stop();
    }

    // Immediate first check
    this.checkPaymentStatus();

    // Set up periodic check
    this.intervalId = window.setInterval(() => {
      this.checkPaymentStatus();
    }, this.checkInterval);

    console.log(`[PixMonitor] Monitoring started for order: ${this.pedidoId}`);
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[PixMonitor] Monitoring stopped for order: ${this.pedidoId}`);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `PIX Monitor finished for order: ${this.pedidoId}`,
        { pedidoId: this.pedidoId, attempts: this.attempts }
      );
    }
  }

  /**
   * Check payment status
   */
  private async checkPaymentStatus(): Promise<void> {
    try {
      this.attempts++;
      console.log(`[PixMonitor] Checking status (${this.attempts}/${this.maxAttempts})`);

      // Query payment status from database
      const { data, error } = await supabase
        .from('pedidos')
        .select('log_pagamento')
        .eq('id', this.pedidoId)
        .single();

      if (error) {
        console.error(`[PixMonitor] Error checking status:`, error);
        return;
      }

      if (!data || !data.log_pagamento) {
        console.warn(`[PixMonitor] Payment data not found`);
        return;
      }

      const paymentLog = data.log_pagamento as PaymentLogData;
      const currentStatus = paymentLog.payment_status;
      
      console.log(`[PixMonitor] Current status: ${currentStatus}`);

      // Notify status changes
      if (currentStatus) {
        this.onStatusChange(currentStatus);
      }

      // Stop monitoring when payment is approved or rejected
      if (['approved', 'rejected'].includes(currentStatus || '') || this.attempts >= this.maxAttempts) {
        if (currentStatus === 'approved') {
          toast.success("Payment approved! Redirecting...");
        } else if (currentStatus === 'rejected') {
          toast.error("Payment rejected");
        } else if (this.attempts >= this.maxAttempts) {
          toast.info("Monitoring time exceeded");
        }
        
        this.stop();
      }
    } catch (err) {
      console.error(`[PixMonitor] Error checking status:`, err);
      
      // Log error
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Error checking PIX status: ${err}`,
        { pedidoId: this.pedidoId, error: String(err) }
      );
      
      // Stop after too many attempts
      if (this.attempts >= this.maxAttempts) {
        this.stop();
      }
    }
  }

  /**
   * Manual status check (used by refresh button)
   */
  public async manualCheck(): Promise<void> {
    try {
      console.log(`[PixMonitor] Manual check requested`);
      await this.checkPaymentStatus();
    } catch (err) {
      console.error(`[PixMonitor] Error in manual check:`, err);
      toast.error("Error checking payment status");
    }
  }
}
