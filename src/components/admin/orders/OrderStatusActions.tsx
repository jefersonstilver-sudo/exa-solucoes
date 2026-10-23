import React, { useMemo, useState } from 'react';
import { Ban, PauseCircle, PlayCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { alterarStatusPedido, PedidoStatusAcao, PedidoStatusResultado } from '@/services/pedidoStatusService';

export interface PedidoParaStatus {
  id: string;
  status: string;
  nome?: string | null;
}

interface Props {
  pedidos: PedidoParaStatus[];
  onDone?: () => void;
  size?: 'sm' | 'default';
  /** layout em grade para a barra do celular */
  compact?: boolean;
  /** os botoes viram itens de uma grade do componente pai (wrapper "contents") */
  grid?: boolean;
}

const INATIVOS = ['cancelado', 'cancelado_automaticamente', 'finalizado'];

const TEXTOS: Record<PedidoStatusAcao, { titulo: string; botao: string; desc: string; motivoObrigatorio: boolean }> = {
  cancelar: {
    titulo: 'Cancelar pedido',
    botao: 'Cancelar pedido',
    desc: 'Tira os vídeos das telas, cancela as cobranças futuras no Asaas (o que já foi pago fica como está) e marca o pedido como cancelado. O cliente recebe o motivo por e-mail e WhatsApp, e você recebe o aviso.',
    motivoObrigatorio: true,
  },
  suspender: {
    titulo: 'Suspender pedido',
    botao: 'Suspender',
    desc: 'Tira os vídeos das telas até você reativar. A cobrança continua normal. O cliente recebe o motivo por e-mail e WhatsApp, e você recebe o aviso.',
    motivoObrigatorio: true,
  },
  reativar: {
    titulo: 'Reativar pedido',
    botao: 'Reativar',
    desc: 'Volta o pedido para o ar e reenvia os vídeos para as telas. O cliente é avisado por e-mail e WhatsApp.',
    motivoObrigatorio: false,
  },
};

const OrderStatusActions: React.FC<Props> = ({ pedidos, onDone, size = 'sm', compact = false, grid = false }) => {
  const { isSuperAdmin } = useAuth();
  const [acao, setAcao] = useState<PedidoStatusAcao | null>(null);
  const [motivo, setMotivo] = useState('');
  const [rodando, setRodando] = useState(false);
  const [resultados, setResultados] = useState<Array<{ p: PedidoParaStatus; r: PedidoStatusResultado }>>([]);

  const podeSuspender = useMemo(() => pedidos.filter(p => !INATIVOS.includes(p.status) && p.status !== 'bloqueado'), [pedidos]);
  const podeCancelar = useMemo(() => pedidos.filter(p => !['cancelado', 'cancelado_automaticamente'].includes(p.status)), [pedidos]);
  const podeReativar = useMemo(() => pedidos.filter(p => p.status === 'bloqueado'), [pedidos]);

  if (!isSuperAdmin || pedidos.length === 0) return null;

  const alvo = acao === 'cancelar' ? podeCancelar : acao === 'suspender' ? podeSuspender : acao === 'reativar' ? podeReativar : [];
  const cfg = acao ? TEXTOS[acao] : null;

  const abrir = (a: PedidoStatusAcao) => { setAcao(a); setMotivo(''); setResultados([]); };
  const fechar = () => {
    if (rodando) return;
    const mudou = resultados.some(x => x.r.ok);
    setAcao(null); setResultados([]); setMotivo('');
    if (mudou) onDone?.();
  };

  const executar = async () => {
    if (!acao || !cfg) return;
    if (cfg.motivoObrigatorio && motivo.trim().length < 3) { toast.error('Informe o motivo'); return; }
    setRodando(true);
    const out: Array<{ p: PedidoParaStatus; r: PedidoStatusResultado }> = [];
    for (const p of alvo) {
      const r = await alterarStatusPedido(acao, p.id, motivo.trim());
      out.push({ p, r });
      setResultados([...out]);
    }
    setRodando(false);
    const okN = out.filter(x => x.r.ok).length;
    if (okN === out.length) toast.success(`${okN} pedido(s): ${acao === 'cancelar' ? 'cancelado(s)' : acao === 'suspender' ? 'suspenso(s)' : 'reativado(s)'}`);
    else toast.error(`${out.length - okN} de ${out.length} pedido(s) não foram alterados. Veja o detalhe.`);
  };

  const btnCls = grid ? 'w-full sm:w-auto h-11 rounded-xl' : compact ? 'flex-1 h-10 text-sm font-medium' : '';

  return (
    <>
      <div className={grid ? 'contents' : compact ? 'flex gap-2' : 'flex items-center gap-2 flex-wrap'}>
        {podeReativar.length > 0 && (
          <Button size={size} variant="outline" className={`border-green-600/50 text-green-700 hover:bg-green-50 ${btnCls}`} onClick={() => abrir('reativar')}>
            <PlayCircle className="h-4 w-4 mr-1" /> Reativar{pedidos.length > 1 ? ` (${podeReativar.length})` : ''}
          </Button>
        )}
        {podeSuspender.length > 0 && (
          <Button size={size} variant="outline" className={`border-amber-500/60 text-amber-700 hover:bg-amber-50 ${btnCls}`} onClick={() => abrir('suspender')}>
            <PauseCircle className="h-4 w-4 mr-1" /> Suspender{pedidos.length > 1 ? ` (${podeSuspender.length})` : ''}
          </Button>
        )}
        {podeCancelar.length > 0 && (
          <Button size={size} variant="outline" className={`border-destructive/50 text-destructive hover:bg-destructive/10 ${btnCls}`} onClick={() => abrir('cancelar')}>
            <Ban className="h-4 w-4 mr-1" /> Cancelar pedido{pedidos.length > 1 ? ` (${podeCancelar.length})` : ''}
          </Button>
        )}
      </div>

      <Dialog open={!!acao} onOpenChange={(v) => { if (!v) fechar(); }}>
        <DialogContent className="max-w-lg">
          {cfg && (
            <>
              <DialogHeader>
                <DialogTitle>{cfg.titulo}{alvo.length > 1 ? ` (${alvo.length} pedidos)` : ''}</DialogTitle>
                <DialogDescription>{cfg.desc}</DialogDescription>
              </DialogHeader>

              {alvo.length > 0 && alvo.length <= 6 && (
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {alvo.map(p => <li key={p.id}>{p.nome || p.id.slice(0, 8)}</li>)}
                </ul>
              )}

              {resultados.length === 0 && (
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={cfg.motivoObrigatorio ? 'Motivo (obrigatório). Este texto vai para o cliente.' : 'Observação para o cliente (opcional)'}
                  className="min-h-[90px]"
                  disabled={rodando}
                  maxLength={500}
                />
              )}

              {acao === 'cancelar' && resultados.length === 0 && (
                <Alert variant="destructive">
                  <AlertDescription>O cancelamento não pode ser desfeito por aqui. Se o Asaas não confirmar o cancelamento das cobranças, o pedido não é cancelado.</AlertDescription>
                </Alert>
              )}

              {resultados.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-auto">
                  {resultados.map(({ p, r }) => (
                    <div key={p.id} className="text-sm border rounded-md p-2">
                      <div className="flex items-center gap-2 font-medium">
                        {r.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                        {p.nome || p.id.slice(0, 8)}
                      </div>
                      {r.ok ? (
                        <div className="text-muted-foreground pl-6">
                          {r.telas && <div>Telas: {r.telas.ok ? r.telas.info : `atenção, ${r.telas.info}`}</div>}
                          {r.asaas && <div>Asaas: {r.asaas.cancelados ? `${r.asaas.cancelados} cobrança(s)/recorrência cancelada(s)` : 'nada em aberto'}</div>}
                          {r.aviso && !r.repetido && <div>Cliente avisado: e-mail {r.aviso.email ? 'sim' : 'não'}, WhatsApp {r.aviso.whatsapp ? 'sim' : 'não'}</div>}
                        </div>
                      ) : (
                        <div className="text-destructive pl-6">{r.erro}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                {resultados.length > 0 && !rodando ? (
                  <Button onClick={fechar}>Fechar</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={fechar} disabled={rodando}>Voltar</Button>
                    <Button
                      variant={acao === 'reativar' ? 'default' : 'destructive'}
                      onClick={executar}
                      disabled={rodando || (cfg.motivoObrigatorio && motivo.trim().length < 3) || alvo.length === 0}
                    >
                      {rodando ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processando {resultados.length + 1}/{alvo.length}...</> : `Confirmar: ${cfg.botao}`}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderStatusActions;
