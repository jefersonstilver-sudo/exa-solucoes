
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from './useUserSession';
import { toast } from 'sonner';

export const useOrderSecurity = (pedidoId: string | null) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoggedIn } = useUserSession();

  useEffect(() => {
    if (!pedidoId || !isLoggedIn) {
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    checkOrderAccess();
  }, [pedidoId, isLoggedIn, user?.id]);

  const checkOrderAccess = async () => {
    try {
      setIsLoading(true);

      console.log("🔐 [OrderSecurity] Verificando acesso ao pedido:", pedidoId);

      // Verificar se o usuário pode acessar o pedido
      const { data, error } = await supabase.rpc('can_access_order', {
        p_pedido_id: pedidoId
      });

      if (error) {
        console.error("❌ [OrderSecurity] Erro na verificação:", error);
        setIsAuthorized(false);
        toast.error("Erro ao verificar permissões do pedido");
        return;
      }

      console.log("🔐 [OrderSecurity] Resultado da verificação:", data);

      if (!data) {
        setIsAuthorized(false);
        toast.error("Você não tem permissão para acessar este pedido ou ele expirou");
        return;
      }

      setIsAuthorized(true);

    } catch (error) {
      console.error("❌ [OrderSecurity] Erro:", error);
      setIsAuthorized(false);
      toast.error("Erro ao verificar acesso ao pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthorized,
    isLoading,
    recheckAccess: checkOrderAccess
  };
};
