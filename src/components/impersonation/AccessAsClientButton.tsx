import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonProps } from '@/components/ui/button';
import { UserCog, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccessAsClientButtonProps extends Omit<ButtonProps, 'onClick'> {
  targetUserId: string;
  pedidoId?: string | null;
  /** Optional path inside /anunciante to land on. Defaults to "pedidos" or "pedido/{id}". */
  redirectPath?: string;
  label?: string;
  iconOnly?: boolean;
  /**
   * Quando definido, o botão NÃO navega para `/anunciante/...`.
   * Em vez disso, inicia a sessão de impersonação e chama esse callback
   * com o `session_id` para que o caller abra o painel/modal interno.
   */
  onInternalView?: (sessionId: string) => void;
}

/**
 * Button visible only to super_admin / admin_master_video.
 * Calls start-impersonation and navigates (same window) to /anunciante
 * with ?impersonate=<session_id>. The advertiser portal then substitutes
 * the userProfile via useEffectiveAuth.
 */
const AccessAsClientButton: React.FC<AccessAsClientButtonProps> = ({
  targetUserId,
  pedidoId,
  redirectPath,
  label = 'Acessar como cliente',
  iconOnly = false,
  onInternalView,
  className,
  variant = 'destructive',
  size = 'sm',
  ...rest
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!targetUserId) {
      toast.error('Cliente não identificado.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('start-impersonation', {
        body: { target_user_id: targetUserId, target_pedido_id: pedidoId ?? null },
      });
      if (error) throw error;
      const sessionId = (data as any)?.session_id;
      if (!sessionId) throw new Error('Sessão não retornada.');

      if (onInternalView) {
        toast.success('Modo cliente ativo (30 min).');
        onInternalView(sessionId);
        return;
      }

      const path = redirectPath ?? (pedidoId ? `pedido/${pedidoId}` : 'pedidos');
      const url = `/anunciante/${path}?impersonate=${encodeURIComponent(sessionId)}`;
      toast.success('Modo cliente ativo (30 min).');
      navigate(url);
    } catch (e: any) {
      console.error('start-impersonation error', e);
      toast.error(e?.message || 'Falha ao iniciar impersonação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
      title={label}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
      {!iconOnly && <span className="ml-1">{label}</span>}
    </Button>
  );
};

export default AccessAsClientButton;
