import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, ExternalLink, Loader2, QrCode, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

/**
 * Admin — Contrato e pagamentos (auditoria de cobrança, 06/11/2026).
 * Parcelas do contrato inteiro: pagas (com comprovante e ID do Pix), atrasadas (há quantos dias) e a vencer.
 * Interno: o cliente não vê nem é avisado. O Pix das atrasadas é gerado aqui (sem multa/juros, sem aviso do Asaas)
 * e, quando pago, as parcelas baixam sozinhas pelo ID da cobrança no Asaas. Função: exa2-auditoria-cobranca.
 */
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—');
const dataHoraBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');

async function chamar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('exa2-auditoria-cobranca', { body });
  if (error || !data?.ok) throw new Error(data?.erro || (error as any)?.message || 'Falha');
  return data;
}

const CHIP: Record<string, string> = {
  pago: 'bg-green-50 text-green-700',
  atrasado: 'bg-red-50 text-red-700',
  a_vencer: 'bg-gray-100 text-gray-700',
  perdoado: 'bg-blue-50 text-blue-700',
  cancelado: 'bg-gray-100 text-gray-400',
  cortesia: 'bg-amber-50 text-amber-800',
};
const ROTULO: Record<string, string> = { pago: 'Paga', atrasado: 'Atrasada', a_vencer: 'A vencer', perdoado: 'Perdoada', cancelado: 'Cancelada', cortesia: 'Cortesia' };

const AuditoriaCobrancaPedido: React.FC<{ pedidoId: string }> = ({ pedidoId }) => {
  const { isSuperAdmin } = useAuth();
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [rodando, setRodando] = useState<string | null>(null);
  const [pixAberto, setPixAberto] = useState<any>(null);

  const ler = useCallback(async () => {
    setCarregando(true);
    try { setDados(await chamar({ action: 'listar', pedido_id: pedidoId })); } catch (e: any) { toast.error(e.message); }
    setCarregando(false);
  }, [pedidoId]);
  useEffect(() => { ler(); }, [ler]);

  const copiar = (t: string, msg = 'Copiado') => { navigator.clipboard?.writeText(t).then(() => toast.success(msg)).catch(() => toast.error('Não consegui copiar')); };

  if (carregando && !dados) return <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando contrato e pagamentos…</div>;
  const parcelas: any[] = dados?.parcelas || [];
  if (!parcelas.length) return null; // pedido ainda sem auditoria
  const r = dados?.resumo || {};
  const lotes: any[] = dados?.lotes || [];
  const loteAberto = lotes.find((l) => l.status === 'aberto');
  const btn = 'inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-40';

  const gerarPix = async () => {
    setRodando('pix');
    try { const d = await chamar({ action: 'gerar_pix', pedido_id: pedidoId }); toast.success(`Pix gerado: ${d.valor}`); await ler(); setPixAberto(d.lote); } catch (e: any) { toast.error(e.message); }
    setRodando(null);
  };
  const cancelarPix = async (l: any) => {
    setRodando('c' + l.id);
    try { await chamar({ action: 'cancelar_pix', lote_id: l.id }); toast.success('Pix cancelado'); setPixAberto(null); await ler(); } catch (e: any) { toast.error(e.message); }
    setRodando(null);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-base font-bold text-gray-900">Contrato e pagamentos</h3>
        {dados?.pedido?.data_inicio_cobranca && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">Plano de {dataBR(dados.pedido.data_inicio_cobranca)} a {dataBR(dados.pedido.data_fim)}</span>}
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Auditoria interna · o cliente não vê nem é avisado</span>
        <button type="button" onClick={ler} className={btn} aria-label="Atualizar">{carregando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</button>
      </div>

      <div className={`mt-3 flex flex-wrap items-center gap-3 rounded-xl p-3 ${r.em_dia ? 'bg-green-50' : 'bg-red-50'}`}>
        {r.em_dia ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <AlertTriangle className="h-6 w-6 text-red-600" />}
        <div className="mr-auto">
          <div className={`text-sm font-bold ${r.em_dia ? 'text-green-800' : 'text-red-800'}`}>
            {r.em_dia ? 'Contrato em dia' : `${r.qtd_atrasadas} parcela${r.qtd_atrasadas === 1 ? '' : 's'} atrasada${r.qtd_atrasadas === 1 ? '' : 's'} · ${brl(r.atrasado)}`}
          </div>
          {!r.em_dia && <div className="text-xs text-red-700">Inadimplente desde {dataBR(r.atrasado_desde)} · {r.dias_atraso} dias</div>}
        </div>
        {isSuperAdmin && !r.em_dia && !loteAberto && (
          <button type="button" disabled={!!rodando} onClick={gerarPix} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#9C1E1E] px-3 text-xs font-bold text-white disabled:opacity-50">
            {rodando === 'pix' ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Gerar Pix das atrasadas ({brl(r.atrasado)})
          </button>
        )}
        {loteAberto && (
          <button type="button" onClick={() => setPixAberto(loteAberto)} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#9C1E1E] px-3 text-xs font-bold text-white">
            <QrCode className="h-4 w-4" /> Ver Pix gerado · {brl(loteAberto.valor)}
          </button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Contrato', brl(r.total_contrato), `${parcelas.length - (r.qtd_cortesia || 0)} parcelas${r.qtd_cortesia ? ` + ${r.qtd_cortesia} cortesia` : ''}`],
          ['Pago', brl(r.pago), `${r.qtd_pagas} parcela${r.qtd_pagas === 1 ? '' : 's'}`],
          ['Atrasado', brl(r.atrasado), `${r.qtd_atrasadas} parcela${r.qtd_atrasadas === 1 ? '' : 's'}`],
          ['A vencer', brl(r.a_vencer), r.proximo_vencimento ? `próxima ${dataBR(r.proximo_vencimento)}` : '—'],
        ].map(([t, v, s]) => (
          <div key={t} className="rounded-xl border border-gray-100 p-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{t}</div>
            <div className="text-base font-extrabold tabular-nums text-gray-900">{v}</div>
            <div className="text-[11px] text-gray-500">{s}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
        {parcelas.map((p) => (
          <div key={p.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 ${p.situacao === 'atrasado' ? 'bg-red-50/40' : ''}`}>
            <span className="w-6 text-xs font-bold text-gray-400">{p.numero}</span>
            <div className="min-w-[160px] flex-1">
              <div className="text-sm font-semibold text-gray-900">{p.competencia ? `${p.competencia} · ` : ''}<span className={p.situacao === 'cortesia' || p.situacao === 'perdoado' ? 'text-gray-400 line-through' : ''}>{brl(p.valor)}</span>{p.situacao === 'cortesia' && <span className="ml-1.5 font-bold text-amber-700">Cortesia</span>}</div>
              <div className="text-xs text-gray-500">
                Vence {dataBR(p.data_vencimento)}
                {p.situacao === 'pago' && <> · paga em {dataHoraBR(p.pago_em)}{p.valor_pago && Number(p.valor_pago) !== Number(p.valor) ? ` (${brl(p.valor_pago)})` : ''}{p.pagador ? ` · ${p.pagador}` : ''}</>}
                {p.situacao === 'atrasado' && <span className="font-semibold text-red-700"> · {p.dias_atraso} dias de atraso</span>}
                {p.pix_lote_id && p.situacao !== 'pago' && <span className="font-semibold text-[#9C1E1E]"> · no Pix gerado</span>}
              </div>
              {p.observacao && <div className="text-[11px] text-gray-400">{p.observacao}</div>}
              {p.pix_transacao_id && (
                <button type="button" onClick={() => copiar(p.pix_transacao_id, 'ID do Pix copiado')} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800">
                  <Copy className="h-3 w-3" /> Pix {p.pix_transacao_id}
                </button>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${CHIP[p.situacao] || ''}`}>{ROTULO[p.situacao] || p.situacao}</span>
            {p.comprovante_url && <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" className={btn}><ExternalLink className="h-3.5 w-3.5" /> Comprovante</a>}
          </div>
        ))}
      </div>

      {lotes.filter((l) => l.status !== 'aberto').length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          {lotes.filter((l) => l.status !== 'aberto').map((l) => (
            <div key={l.id}>Pix de regularização {brl(l.valor)} · {l.status === 'pago' ? `pago em ${dataHoraBR(l.pago_em)}` : 'cancelado'} · parcelas {(l.parcelas || []).join(', ')}</div>
          ))}
        </div>
      )}

      <Dialog open={!!pixAberto} onOpenChange={(o) => !o && !rodando && setPixAberto(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Pix de regularização · {brl(pixAberto?.valor)}</DialogTitle></DialogHeader>
          {pixAberto && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Parcelas {(pixAberto.parcelas || []).join(', ')} · vence {dataBR(pixAberto.vencimento)} · sem multa nem juros. O cliente <b>não</b> foi avisado: envie você quando decidir. Pago, as parcelas baixam sozinhas e o contrato fica em dia.</p>
              {pixAberto.pix_qr_base64 && <img src={`data:image/png;base64,${pixAberto.pix_qr_base64}`} alt="QR Code do Pix" className="mx-auto h-48 w-48" />}
              {pixAberto.pix_copia_cola && (
                <button type="button" onClick={() => copiar(pixAberto.pix_copia_cola, 'Pix copia e cola copiado')} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800">
                  <Copy className="h-4 w-4" /> Copiar Pix copia e cola
                </button>
              )}
              {pixAberto.invoice_url && <a href={pixAberto.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800"><ExternalLink className="h-4 w-4" /> Abrir fatura no Asaas</a>}
              {isSuperAdmin && pixAberto.status === 'aberto' && (
                <button type="button" disabled={!!rodando} onClick={() => cancelarPix(pixAberto)} className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50">
                  {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Cancelar este Pix
                </button>
              )}
              {pixAberto.status === 'pago' && <div className="flex items-center gap-2 text-sm font-semibold text-green-700"><Check className="h-4 w-4" /> Pago</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AuditoriaCobrancaPedido;
