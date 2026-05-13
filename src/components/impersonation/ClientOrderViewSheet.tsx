import React from 'react';
import { Sheet, SheetPrimitiveContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { X, ShieldAlert } from 'lucide-react';
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
  const iframeUrl = open && pedidoId && sessionId
    ? `/anunciante/pedido/${pedidoId}?impersonate=${encodeURIComponent(sessionId)}&embedded=1`
    : null;

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
        <div
          className="relative z-20 flex items-center justify-between gap-3 px-4 py-2 shadow-md"
          style={{ backgroundColor: '#C7141A', color: '#ffffff' }}
        >
          <div className="flex items-center gap-2 min-w-0" style={{ color: '#ffffff' }}>
            <ShieldAlert className="h-5 w-5 flex-shrink-0" style={{ color: '#ffffff' }} />
            <div className="text-sm font-semibold truncate" style={{ color: '#ffffff' }}>
              Visualizando como cliente
              {clientLabel && <span className="font-bold ml-1" style={{ color: '#ffffff' }}>{clientLabel}</span>}
              {pedidoId && <span className="ml-2 font-mono text-xs opacity-80" style={{ color: '#ffffff' }}>#{pedidoId.substring(0, 8)}</span>}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="font-semibold hover:opacity-90"
            style={{ backgroundColor: '#ffffff', color: '#C7141A' }}
            onClick={handleClose}
          >
            <X className="h-4 w-4 mr-1" /> Fechar
          </Button>
        </div>

        {/* Corpo — sem loader próprio: o portal do anunciante exibe seu próprio loader dentro do iframe */}
        <div className="flex-1 bg-gray-50 relative overflow-hidden">
          {iframeUrl && (
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Visão do cliente"
              className="w-full h-full border-0"
            />
          )}
        </div>
      </SheetPrimitiveContent>
    </Sheet>
  );
};

export default ClientOrderViewSheet;
