import React, { useEffect, useState } from 'react';
import { Sheet, SheetPrimitiveContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { X, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientOrderViewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pedido a ser visualizado */
  pedidoId: string | null;
  /** Sessão de impersonação JÁ criada (start-impersonation feito antes) */
  sessionId: string | null;
  /** Nome do cliente, para exibição na faixa */
  clientLabel?: string | null;
}

/**
 * Painel interno (Sheet) que renderiza o portal do anunciante via iframe
 * apontando para /anunciante/pedido/:id?impersonate=<sid>&embedded=1.
 *
 * - Não troca de página, não abre nova aba.
 * - A sessão de impersonação é criada PELO BOTÃO antes de abrir o sheet
 *   (via AccessAsClientButton com onInternalView). O fechamento encerra-a.
 */
const ClientOrderViewSheet: React.FC<ClientOrderViewSheetProps> = ({
  open,
  onOpenChange,
  pedidoId,
  sessionId,
  clientLabel,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  const iframeUrl = open && pedidoId && sessionId
    ? `/anunciante/pedido/${pedidoId}?impersonate=${encodeURIComponent(sessionId)}&embedded=1`
    : null;

  useEffect(() => {
    if (open) setIframeLoading(true);
  }, [open, iframeUrl]);

  const handleClose = async () => {
    if (sessionId) {
      try {
        await supabase.functions.invoke('end-impersonation', {
          body: { session_id: sessionId, reason: 'manual' },
        });
      } catch (e) { console.warn('end-impersonation falhou', e); }
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <SheetPrimitiveContent
        side="right"
        className="w-full sm:max-w-none p-0 gap-0 flex flex-col"
        style={{ width: '100vw', maxWidth: '100vw' }}
      >
        <VisuallyHidden>
          <SheetHeader>
            <SheetTitle>Visualizando como cliente</SheetTitle>
            <SheetDescription>
              Painel interno mostrando a área do anunciante para o pedido selecionado.
            </SheetDescription>
          </SheetHeader>
        </VisuallyHidden>

        {/* Faixa de identidade */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 text-primary-foreground shadow-md bg-gradient-to-r from-exa-red-dark to-exa-red">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <div className="text-sm font-semibold truncate">
              Visualizando como cliente
              {clientLabel && <span className="font-bold ml-1">{clientLabel}</span>}
              {pedidoId && <span className="ml-2 font-mono text-xs opacity-80">#{pedidoId.substring(0, 8)}</span>}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-background text-exa-red hover:bg-background/90 font-semibold"
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-1" /> Fechar
          </Button>
        </div>

        {/* Corpo */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden">
          {iframeLoading && iframeUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Carregando visão do cliente…</span>
              </div>
            </div>
          )}
          {iframeUrl && (
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Visão do cliente"
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
            />
          )}
        </div>
      </SheetPrimitiveContent>
    </Sheet>
  );
};

export default ClientOrderViewSheet;
