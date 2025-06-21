
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSystemMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    // Executar cancelamento automático a cada hora
    const interval = setInterval(async () => {
      await runAutoCancellation();
    }, 60 * 60 * 1000); // 1 hora

    // Executar imediatamente
    runAutoCancellation();

    return () => clearInterval(interval);
  }, []);

  const runAutoCancellation = async () => {
    try {
      setIsMonitoring(true);
      console.log("🔄 [SystemMonitoring] Executando cancelamento automático");

      const { data, error } = await supabase.functions.invoke('auto-cancel-expired-orders');

      if (error) {
        console.error("❌ [SystemMonitoring] Erro no cancelamento automático:", error);
        return;
      }

      console.log("✅ [SystemMonitoring] Resultado:", data);
      setLastCheck(new Date());

      // Se houve cancelamentos, mostrar notificação
      if (data.result?.cancelled_orders > 0) {
        toast.info(`${data.result.cancelled_orders} pedidos expirados foram cancelados automaticamente`);
      }

    } catch (error) {
      console.error("❌ [SystemMonitoring] Erro:", error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const manualCheck = async () => {
    await runAutoCancellation();
  };

  return {
    isMonitoring,
    lastCheck,
    manualCheck
  };
};
