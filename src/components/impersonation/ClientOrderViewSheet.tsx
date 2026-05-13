import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientOrderViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pedido a ser visualizado */
  pedidoId: string | null;
  /** ID do cliente alvo (anunciante dono do pedido) */
  clientId: string | null;
  /** Nome do cliente, para exibição na faixa */
  clientLabel?: string | null;
}

/**
 * Painel interno (Sheet) que renderiza o portal do anunciante via iframe
 * apontando para /anunciante/pedido/:id?impersonate=<sid>&embedded=1.
 *
 * - Não troca de página: o super_admin permanece em /super_admin/pedidos.
 * - Sessão de impersonação criada via start-impersonation.
 * - Ao fechar, end-impersonation é chamado para auditoria.
 */
const ClientOrderViewSheet: React.FC<ClientOrderViewSheetProps> = ({
  open,
  onOpenChange,
  pedidoId,
  clientId,
  clientLabel,
}) => {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Iniciar impersonação quando abre
  useEffect(() => {
    if (!open || !pedidoId || !clientId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setIframeUrl(null);
      try {
        const { data, error } = await supabase.functions.invoke('start-impersonation', {
          body: { target_user_id: clientId, target_pedido_id: pedidoId },
        });
        if (error) throw error;
        const sid = (data as any)?.session_id;
        if (!sid) throw new Error('Sessão de impersonação não retornada.');
        if (cancelled) return;
        setSessionId(sid);
        const url = `/anunciante/pedido/${pedidoId}?impersonate=${encodeURIComponent(sid)}&embedded=1`;
        setIframeUrl(url);
      } catch (e: any) {
        console.error('start-impersonation falhou', e);
        if (!cancelled) setError(e?.message || 'Falha ao iniciar visualização do cliente.');
        toast.error(e?.message || 'Falha ao iniciar visualização do cliente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, pedidoId, clientId]);

  // Encerrar sessão quando fecha
  const handleClose = async () => {
    if (sessionId) {
      try {
        await supabase.functions.invoke('end-impersonation', {
          body: { session_id: sessionId, reason: 'manual' },
        });
      } catch (e) { console.warn('end-impersonation falhou', e); }
    }
    setSessionId(null);
    setIframeUrl(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none p-0 gap-0 flex flex-col"
        style={{ width: '100vw', maxWidth: '100vw' }}
      >
        {/* Faixa de identidade */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-2 text-white shadow-md"
          style={{ background: 'linear-gradient(90deg, #7D1818 0%, #C7141A 100%)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm font-semibold truncate">
              Visualizando como cliente
              {clientLabel && <span className="font-bold ml-1">{clientLabel}</span>}
              {pedidoId && <span className="ml-2 font-mono text-xs opacity-80">#{pedidoId.substring(0, 8)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {iframeUrl && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 hover:bg-white/25 text-white border-0"
                onClick={() => window.open(iframeUrl, '_blank')}
                title="Abrir em nova aba"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-[#7D1818] hover:bg-white/90 font-semibold"
              onClick={handleClose}
            >
              <X className="h-4 w-4 mr-1" /> Fechar
            </Button>
          </div>
        </div>

        {/* Corpo */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando visão do cliente…</span>
              </div>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-md text-center space-y-3">
                <p className="text-destructive font-semibold">{error}</p>
                <Button onClick={handleClose} variant="outline">Fechar</Button>
              </div>
            </div>
          )}
          {iframeUrl && !error && (
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Visão do cliente"
              className="w-full h-full border-0"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ClientOrderViewSheet;
