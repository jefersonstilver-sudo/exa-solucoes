
import { useState, useEffect } from 'react';
import { readAsaasAudit } from '@/services/asaasAuditService';
import { readAsaasStatus } from '@/services/asaasPaymentService';
import { toast } from 'sonner';

interface AutoVerificationResult {
  success: boolean;
  total_checked: number;
  verified_count: number;
  approved_count: number;
  errors: string[];
  timestamp: string;
}

export const useAutoPaymentVerifier = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutoVerificationResult | null>(null);
  const runVerification = async (): Promise<AutoVerificationResult> => {
    setIsRunning(true);
    try {
      const audit = await readAsaasAudit();
      let approved = 0; const errors: string[] = [];
      for (const charge of audit.charges.filter(c => c.asaas_id.startsWith('pay_'))) {
        try { if ((await readAsaasStatus(charge.asaas_id)).paid) approved++; }
        catch { errors.push(`Consulta indisponível: ${charge.asaas_id}`); }
      }
      const result = { success: errors.length === 0, total_checked: audit.charges.length, verified_count: audit.charges.length - errors.length, approved_count: approved, errors, timestamp: new Date().toISOString() };
      setLastResult(result); return result;
    } finally { setIsRunning(false); }
  };
  return { isRunning, lastResult, runVerification, isAutoRunning: false,
    startAutoVerification: () => toast.warning('Automação desativada'), stopAutoVerification: () => {} };
};
