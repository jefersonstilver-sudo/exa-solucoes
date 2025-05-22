
/**
 * Types shared between PIX payment monitoring services
 */

export interface PixPaymentStatus {
  paymentId: string;
  status: string;
  pedidoId: string;
}

export interface PaymentLogData {
  payment_method?: string;
  preference_id?: string;
  payment_id?: string;
  payment_status?: string;
  pix_data?: {
    qr_code_base64?: string;
    qr_code?: string;
  };
}

export interface PixMonitorOptions {
  pedidoId: string;
  paymentId: string;
  onStatusChange: (status: string) => void;
  checkInterval?: number;
  maxAttempts?: number;
}

export interface PixMonitorHookOptions {
  pedidoId: string;
  paymentId: string;
  onStatusChange: (status: string) => void;
}

export interface PixMonitorControls {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkNow: () => Promise<void>;
}
