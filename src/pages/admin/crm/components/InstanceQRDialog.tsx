import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';
import { useEvolutionInstanceActions } from '../lib/useEvolutionInstanceActions';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  instanceName: string;
  rowId?: string;
  initialQr?: string | null;
  onConnected?: () => void;
  title?: string;
}

export const InstanceQRDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  instanceName,
  rowId,
  initialQr,
  onConnected,
  title,
}) => {
  const { fetchQr, fetchConnectionState, busy } = useEvolutionInstanceActions();
  const [qr, setQr] = useState<string | null>(initialQr ?? null);
  const [connected, setConnected] = useState(false);
  const pollingRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const refresh = async () => {
    try {
      const base64 = await fetchQr(instanceName);
      if (base64) setQr(base64);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao buscar QR');
    }
  };

  useEffect(() => {
    if (!open) {
      stopPolling();
      setConnected(false);
      return;
    }
    if (!initialQr) refresh();
    // poll connection state
    pollingRef.current = window.setInterval(async () => {
      const state = await fetchConnectionState(instanceName);
      if (state === 'open') {
        stopPolling();
        setConnected(true);
        if (rowId) {
          // marca como conectado
          const { supabase } = await import('@/integrations/supabase/client');
          await (supabase as any)
            .from('evolution_instances')
            .update({
              status: 'connected',
              last_connected_at: new Date().toISOString(),
            })
            .eq('id', rowId);
        }
        onConnected?.();
      }
    }, 3000);
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instanceName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? 'Conectar instância'}</DialogTitle>
          <DialogDescription>
            {connected
              ? 'Conectado com sucesso.'
              : 'Escaneie o QR code com o WhatsApp do número desejado.'}
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Instância <span className="font-mono">{instanceName}</span> conectada.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
            >
              Concluir
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center bg-gray-50 rounded-xl p-4 border border-gray-200">
              {qr ? (
                <img
                  src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`}
                  alt="QR Code Evolution"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  Aguardando QR…
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-medium mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                Como conectar
              </div>
              No WhatsApp, vá em{' '}
              <strong>Configurações → Aparelhos conectados → Conectar aparelho</strong>{' '}
              e aponte para o QR acima.
            </div>
            <div className="text-xs text-muted-foreground font-mono break-all">
              Instância: {instanceName}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={refresh} disabled={busy}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${busy ? 'animate-spin' : ''}`} />
                Atualizar QR
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstanceQRDialog;
