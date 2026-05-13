import React, { useState } from 'react';
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
}

/**
 * Button visible only to super_admin / admin_master_video.
 * Calls start-impersonation and opens /anunciante in a new isolated tab
 * with ?impersonate=<session_id>.
 */
const AccessAsClientButton: React.FC<AccessAsClientButtonProps> = ({
  targetUserId,
  pedidoId,
  redirectPath,
  label = 'Acessar como cliente',
  iconOnly = false,
  className,
  variant = 'destructive',
  size = 'sm',
  ...rest
}) => {
  const [loading, setLoading] = useState(false);

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

      const path = redirectPath ?? (pedidoId ? `pedido/${pedidoId}` : 'pedidos');
      const url = `/anunciante/${path}?impersonate=${encodeURIComponent(sessionId)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success('Sessão de impersonação iniciada (30 min).');
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
