
export interface FinancialStats {
  supabase_total: number;
  webhook_count: number;
  missing_webhooks: number;
  reconciliation_status: string;
  anomaly_score: number;
  status: string;
}

export interface AnomaliesData {
  duplicate_orders: number;
  zero_value_orders: number;
  suspicious_timing: number;
  missing_payment_logs: number;
  anomaly_score: number;
  status: string;
}

export interface AuditResult {
  success: boolean;
  duplicates_fixed: number;
  orphaned_attempts_migrated: number;
  total_corrected_value: number;
  final_june_total: number;
}
