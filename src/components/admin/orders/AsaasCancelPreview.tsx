import React, { useEffect, useState } from 'react';
import { Loader2, CreditCard, CheckCircle2, AlertTriangle, Ban } from 'lucide-react';
import { mapearAsaasPedidos, precisaCancelar, brl, dataBR, PedidoAsaasMapa } from '@/services/pedidoAsaasCancelService';

interface Props {
  pedidoIds: string[];
  /** avisa o modal: true quando o mapa carregou sem erro de leitura */
  onReady?: (pronto: boolean) => void;
}

/** Mostra, antes da exclusao, o que cada pedido tem no Asaas e o que sera cancelado. So leitura. */
export const AsaasCancelPreview: React.FC<Props> = ({ pedidoIds, onReady }) => {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mapas, setMapas] = useState<PedidoAsaasMapa[]>([]);
  const chave = pedidoIds.join(',');

  useEffect(() => {
    let vivo = true;
    if (!pedidoIds.length) { setLoading(false); setMapas([]); onReady?.(true); return; }
    setLoading(true); setErro(null); onReady?.(false);
    mapearAsaasPedidos(pedidoIds)
      .then(r => { if (!vivo) return; setMapas(r.pedidos); onReady?.(r.pedidos.every(p => p.erros_leitura.length === 0)); })
      .catch(e => { if (!vivo) return; setErro((e as Error).message); onReady?.(false); })
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!pedidoIds.length) return null;
  if (loading) return (
    <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Consultando cobranças no Asaas…
    </div>
  );
  if (erro) return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      Não consegui consultar o Asaas ({erro}). A exclusão fica bloqueada até a consulta funcionar.
    </div>
  );

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto">
      <p className="flex items-center gap-2 text-sm font-medium"><CreditCard className="h-4 w-4" /> Cobranças no Asaas</p>
      {mapas.map(m => (
        <div key={m.pedido_id} className="rounded-lg border p-3 text-sm">
          <div className="mb-1 font-medium">{m.nome || m.pedido_id.slice(0, 8)}</div>
          {!m.tem_algo_no_asaas && <div className="text-muted-foreground">Nada no Asaas para este pedido.</div>}
          {m.autorizacao_pix && (
            <div className="flex items-center gap-1">
              <Ban className="h-3.5 w-3.5 text-destructive" />
              Pix Automático ({m.autorizacao_pix.status}){precisaCancelar(m) && !['CANCELLED', 'CANCELED', 'NAO_ENCONTRADA'].includes(String(m.autorizacao_pix.status)) ? ': será CANCELADO' : ''}
            </div>
          )}
          {m.assinatura && (
            <div className="flex items-center gap-1">
              <Ban className="h-3.5 w-3.5 text-destructive" /> Assinatura ({m.assinatura.status})
            </div>
          )}
          {m.a_cancelar.length > 0 && (
            <div className="mt-1">
              <span className="font-medium text-destructive">{m.a_cancelar.length} cobrança(s) em aberto serão removidas:</span>
              <ul className="ml-4 list-disc text-xs">
                {m.a_cancelar.map(c => <li key={c.id}>{brl(c.valor)} · vence {dataBR(c.vencimento)} · {c.status === 'OVERDUE' ? 'vencida' : 'a vencer'}</li>)}
              </ul>
            </div>
          )}
          {m.pagas.length > 0 && (
            <div className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-600" />
              {m.pagas.length} paga(s) ({m.pagas.map(c => brl(c.valor) + ' em ' + dataBR(c.pago_em)).join(', ')}): não serão estornadas.
            </div>
          )}
          {m.erros_leitura.length > 0 && (
            <div className="mt-1 flex items-start gap-1 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" /> Falha ao ler: {m.erros_leitura.join('; ')}. Exclusão bloqueada.
            </div>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">O pedido só é excluído depois que o Asaas confirmar todos os cancelamentos.</p>
    </div>
  );
};

export default AsaasCancelPreview;
