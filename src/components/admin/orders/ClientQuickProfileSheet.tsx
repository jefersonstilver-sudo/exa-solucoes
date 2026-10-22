import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import ClientProfilePanel from './ClientProfilePanel';
import PedidoWhatsappAcessosCard from './PedidoWhatsappAcessosCard';

export interface ClientQuickProfileTarget {
  pedidoId: string;
  clientId?: string | null;
  clientName?: string | null;
  email?: string | null;
  clientEmail?: string | null;
  whatsapp?: string | null;
}

interface Props {
  target: ClientQuickProfileTarget | null;
  onClose: () => void;
  onChanged?: () => void;
  onOpenOrder?: (pedidoId: string) => void;
}

/** Gaveta aberta ao clicar no cliente na lista de pedidos: cadastro + WhatsApps que administram o pedido. */
const ClientQuickProfileSheet: React.FC<Props> = ({ target, onClose, onChanged, onOpenOrder }) => (
  <Sheet open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
    <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
      {target && (
        <>
          <SheetHeader className="mb-4">
            <SheetTitle>{target.clientName || 'Cliente'}</SheetTitle>
            <SheetDescription>
              Pedido #{target.pedidoId.slice(0, 8)}
              {onOpenOrder && (
                <Button variant="link" size="sm" className="ml-2 h-auto p-0" onClick={() => onOpenOrder(target.pedidoId)}>
                  abrir pedido <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            {target.clientId ? (
              <ClientProfilePanel userId={target.clientId} onSaved={onChanged} compact />
            ) : (
              <p className="text-sm text-muted-foreground">Pedido sem conta de cliente vinculada.</p>
            )}
            <PedidoWhatsappAcessosCard
              pedidoId={target.pedidoId}
              clientId={target.clientId}
              gestorWhatsapp={target.whatsapp}
              gestorEmail={target.clientEmail || target.email}
              onChanged={onChanged}
            />
          </div>
        </>
      )}
    </SheetContent>
  </Sheet>
);

export default ClientQuickProfileSheet;
