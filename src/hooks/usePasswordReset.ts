import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  extractWaitSeconds,
  isRateLimitError,
  DEFAULT_COOLDOWN_SECONDS,
  getRemainingCooldown,
  setCooldown as setGlobalCooldown,
} from '@/utils/resetPasswordCooldown';

interface UsePasswordResetOptions {
  onSuccess?: () => void;
  redirectTo?: string;
}

/**
 * Shared hook for password reset with global cooldown (localStorage-persisted).
 */
export function usePasswordReset(email: string | undefined, options?: UsePasswordResetOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldownState] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const syncCooldown = useCallback(() => {
    if (!email) return;
    const remaining = getRemainingCooldown(email);
    setCooldownState(remaining);
  }, [email]);

  // Start local countdown timer that syncs with global state
  const startCountdown = useCallback((seconds: number) => {
    if (!email) return;
    setGlobalCooldown(email, seconds);
    setCooldownState(seconds);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldownState(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [email]);

  // On mount and email change, sync cooldown from localStorage
  useEffect(() => {
    syncCooldown();
    const remaining = email ? getRemainingCooldown(email) : 0;
    if (remaining > 0) {
      startCountdown(remaining);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email, syncCooldown, startCountdown]);

  const sendReset = useCallback(async () => {
    if (!email) {
      toast.error('Email não informado');
      return false;
    }
    if (cooldown > 0) return false;

    // Double-check global cooldown
    const globalRemaining = getRemainingCooldown(email);
    if (globalRemaining > 0) {
      startCountdown(globalRemaining);
      toast.error(`Aguarde ${globalRemaining} segundos antes de tentar novamente`);
      return false;
    }

    setIsLoading(true);
    try {
      const redirectTo = options?.redirectTo || `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (error) {
        if (isRateLimitError(error)) {
          const wait = extractWaitSeconds(error.message) || 60;
          startCountdown(wait);
          toast.error(`Aguarde ${wait} segundos antes de tentar novamente`);
          return false;
        }
        throw error;
      }

      startCountdown(DEFAULT_COOLDOWN_SECONDS);
      options?.onSuccess?.();
      return true;
    } catch (error: any) {
      console.error('Erro ao enviar email de redefinição:', error);
      toast.error(error?.message || 'Erro ao enviar email de redefinição');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [email, cooldown, options, startCountdown]);

  return { sendReset, isLoading, cooldown };
}
