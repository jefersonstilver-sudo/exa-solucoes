import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailCheckResult {
  exists: boolean;
  role?: string;
  nome?: string;
  email?: string;
}

export const useEmailCheck = () => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<EmailCheckResult | null>(null);

  const checkEmail = useCallback(async (email: string): Promise<EmailCheckResult> => {
    if (!email || !email.includes('@')) {
      setResult(null);
      return { exists: false };
    }

    try {
      setChecking(true);
      
      // Verificar na tabela users
      const { data, error } = await supabase
        .from('users')
        .select('email, role, nome')
        .eq('email', email.trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar email:', error);
        setResult(null);
        return { exists: false };
      }

      if (data) {
        const checkResult: EmailCheckResult = {
          exists: true,
          role: data.role,
          nome: data.nome,
          email: data.email,
        };
        setResult(checkResult);
        return checkResult;
      }

      setResult({ exists: false });
      return { exists: false };
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setResult(null);
      return { exists: false };
    } finally {
      setChecking(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    checking,
    result,
    checkEmail,
    clearResult,
  };
};
