import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface APIStatus {
  name: string;
  status: 'online' | 'offline' | 'pending';
  lastCheck: string | null;
  errorMessage?: string;
  latency?: number;
  credentialsPresent?: boolean;
}

export const useAPIStatus = () => {
  const [statuses, setStatuses] = useState<Record<string, APIStatus>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});

  const testAPI = async (apiName: string, functionName: string) => {
    setTesting(prev => ({ ...prev, [apiName]: true }));
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });

      const latency = Date.now() - startTime;

      if (error) throw error;

      const success = data?.success !== false;

      setStatuses(prev => ({
        ...prev,
        [apiName]: {
          name: apiName,
          status: success ? 'online' : (data?.credentialsPresent === false ? 'pending' : 'offline'),
          lastCheck: new Date().toISOString(),
          latency,
          errorMessage: data?.message || data?.error,
          credentialsPresent: data?.credentialsPresent
        }
      }));

      if (!success && data?.credentialsPresent === false) {
        toast.warning(`${apiName}: Credenciais não configuradas`);
      } else if (!success) {
        toast.error(`${apiName}: ${data?.message || 'Erro na conexão'}`);
      } else {
        toast.success(`${apiName}: Conexão OK`);
      }

      return { success, latency, data };
    } catch (error: any) {
      setStatuses(prev => ({
        ...prev,
        [apiName]: {
          name: apiName,
          status: 'offline',
          lastCheck: new Date().toISOString(),
          errorMessage: error.message
        }
      }));

      toast.error(`${apiName}: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setTesting(prev => ({ ...prev, [apiName]: false }));
    }
  };

  const testAllAPIs = async () => {
    toast.info('Testando todas as integrações...');
    
    await Promise.all([
      testAPI('ManyChat Webhook', 'manychat-webhook-test'),
      testAPI('OpenAI', 'openai-test'),
      testAPI('Supabase', 'supabase-test'),
      testAPI('WhatsApp', 'whatsapp-test'),
      testAPI('Knowledge Indexer', 'knowledge-indexer-test')
    ]);

    toast.success('Testes concluídos');
  };

  return {
    statuses,
    testing,
    testAPI,
    testAllAPIs
  };
};
