import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, FileDown, Loader2, Mail, MessageCircle, RefreshCw, Send, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FinanceiroCard from '@/components/cobranca/FinanceiroCard';
import { useAuth } from '@/hooks/useAuth';

/**
 * Admin — Cobrança do pedido: parcelas/boletos, avisos enviados pela Sofia e as ações do admin master
 * (gerar agora, reenviar, mudar vencimento, perdoar multa, marcar como pago por fora, pedido de confiança).
 * Tudo passa pela função exa2-cobranca (baixa sempre pelo ID da cobrança no Asaas).
 */
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—');
const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const TIPOS: Record<string, string> = { boleto_novo: 'Boleto enviado', lembrete_5d: 'Lembrete 5 dias', vence_amanha: 'Vence amanhã', vence_hoje: 'Vence hoje', venceu: 'Venceu', atraso_3d: 'Aviso de atraso (você)', suspensao: 'Suspensão', suspenso: 'Aviso de suspensão', reativado: 'Reativação', confianca: 'Confiança', pago: 'Pagamento confirmado', email_falhou: 'E-mail não entregue' };

async function chamar(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('exa2-cobranca', { body });
  if (error || !data?.ok) throw new Error(data?.erro || (error as any)?.message || 'Falha');
  return data;
}

type Acao = { tipo: 'vencimento' | 'pago' | 'confianca'; parcela?: any } | null;

const CobrancaPedidoAdmin: React.FC<{ pedidoId: string; clientId?: string | null; onChanged?: () => void }> = ({ pedidoId, clientId, onChanged }) => {
  const { isSuperAdmin } = useAuth();
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [rodando, setRodando] = useState<string | null>(null);
  const [acao, setAcao] = useState<Acao>(null);
  const [campo, setCampo] = useState({ data: '', descricao: '', valor: '', motivo: '' });

  const ler = useCallback(async () => {
    setCarregando(true);
    try { setDados(await chamar({ action: 'admin_parcelas', pedido_id: pedidoId })); } catch (e: any) { toast.error(e.message); }
    setCarregando(false);
  }, [pedidoId]);
  useEffect(() => { ler(); }, [ler]);

  const executar = async (chave: string, body: Record<string, unknown>, ok: string) => {
    setRodando(chave);
    try { await chamar(body); toast.success(ok); setAcao(null); await ler(); onChanged?.(); } catch (e: any) { toast.error(e.message); }
    setRodando(null);
  };

  if (carregando && !dados) return <div className="flex items-center gap-2 p-6 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando cobrança…</div>;
  const ped = dados?.pedido || {};
  const parcelas: any[] = dados?.parcelas || [];
  const avisos: any[] = dados?.avisos || [];
  const confianca = ped.confianca_ate && new Date(ped.confianca_ate).getTime() > Date.now();
  const btn = 'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-40';

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-base font-bold text-gray-900">Cobrança</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{ped.forma_cobranca === 'boleto' ? `Boleto · dia ${ped.dia_vencimento}` : 'Pix (automático/avulso)'}</span>
          {ped.status_adimplencia && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ped.status_adimplencia === 'em_dia' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{ped.status_adimplencia === 'em_dia' ? 'Em dia' : ped.status_adimplencia}</span>}
          {confianca && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">Confiança até {new Date(ped.confianca_ate).toLocaleDateString('pt-BR')}</span>}
          <button type="button" onClick={ler} className={btn} aria-label="Atualizar"><RefreshCw className="h-3.5 w-3.5" /></button>
          {isSuperAdmin && (ped.status === 'bloqueado' || ped.status === 'pendente') && (
            <button type="button" onClick={() => { setCampo({ ...campo, motivo: '' }); setAcao({ tipo: 'confianca' }); }} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white">
              <ShieldCheck className="h-3.5 w-3.5" /> Ativar pedido de confiança (5 dias)
            </button>
          )}
        </div>
        {ped.confianca_motivo && confianca && <p className="mt-2 text-xs text-blue-800">Motivo da confiança: {ped.confianca_motivo}</p>}

        {parcelas.length === 0 ? <p className="mt-3 text-sm text-gray-500">Sem parcelas registradas.</p> : (
          <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {parcelas.map((p) => {
              const vencida = p.status !== 'pago' && p.data_vencimento < hoje();
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
                  <span className="w-6 text-xs font-bold text-gray-400">{p.numero_parcela}</span>
                  <div className="min-w-[150px] flex-1">
                    <div className="text-sm font-semibold text-gray-900">{dataBR(p.data_vencimento)} · {brl(p.valor_final)}{p.multa_perdoada ? ' · multa perdoada' : ''}</div>
                    <div className="text-xs text-gray-500">
                      <span className={p.status === 'pago' ? 'font-semibold text-green-700' : vencida ? 'font-semibold text-red-700' : ''}>{p.status === 'pago' ? `Paga ${p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : ''}` : vencida ? 'Vencida' : p.status}</span>
                      {' · '}{p.forma || 'pix'}{p.asaas_status ? ` · Asaas ${p.asaas_status}` : ''}{p.pago_fora_descricao ? ` · por fora: ${p.pago_fora_descricao}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.boleto_url && <a href={p.boleto_url} target="_blank" rel="noopener noreferrer" className={btn}><FileDown className="h-3.5 w-3.5" /> PDF</a>}
                    {isSuperAdmin && p.status !== 'pago' && (
                      <>
                        {!p.asaas_payment_id && <button type="button" disabled={!!rodando} onClick={() => executar('g' + p.id, { action: 'gerar_agora', parcela_id: p.id }, 'Boleto gerado e enviado')} className={btn}>{rodando === 'g' + p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Gerar boleto agora</button>}
                        {p.asaas_payment_id && <button type="button" disabled={!!rodando} onClick={() => executar('r' + p.id, { action: 'reenviar', parcela_id: p.id }, 'Boleto reenviado (e-mail e WhatsApp)')} className={btn}>{rodando === 'r' + p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Reenviar</button>}
                        <button type="button" disabled={!!rodando} onClick={() => { setCampo({ ...campo, data: p.data_vencimento < hoje() ? hoje() : p.data_vencimento }); setAcao({ tipo: 'vencimento', parcela: p }); }} className={btn}><CalendarClock className="h-3.5 w-3.5" /> Vencimento</button>
                        {!p.multa_perdoada && <button type="button" disabled={!!rodando} onClick={() => executar('m' + p.id, { action: 'perdoar_multa', parcela_id: p.id }, 'Multa e juros perdoados')} className={btn}>{rodando === 'm' + p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Perdoar multa</button>}
                        <button type="button" disabled={!!rodando} onClick={() => { setCampo({ ...campo, descricao: '', valor: String(p.valor_final), data: hoje() }); setAcao({ tipo: 'pago', parcela: p }); }} className={btn}><Wallet className="h-3.5 w-3.5" /> Marcar como pago</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {avisos.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-bold text-gray-900">Avisos enviados pela Sofia</h3>
          <ul className="space-y-1">
            {avisos.slice(0, 25).map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                {a.canal === 'email' ? <Mail className="h-3.5 w-3.5" /> : a.canal === 'whatsapp' ? <MessageCircle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                <span className="font-semibold text-gray-800">{TIPOS[String(a.tipo).replace(/_\d{10,}$/, '')] || a.tipo}</span>
                <span className="truncate">{a.destino}</span>
                <span className={a.ok ? 'text-green-700' : 'text-red-600'}>{a.ok ? 'ok' : 'falhou'}</span>
                <span className="ml-auto whitespace-nowrap text-gray-400">{new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {clientId && <FinanceiroCard userId={clientId} titulo="Financeiro do cliente" />}

      <Dialog open={!!acao} onOpenChange={(o) => !o && !rodando && setAcao(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>{acao?.tipo === 'vencimento' ? 'Mudar vencimento' : acao?.tipo === 'pago' ? 'Marcar parcela como paga' : 'Pedido de confiança'}</DialogTitle></DialogHeader>
          {acao?.tipo === 'vencimento' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Parcela {acao.parcela.numero_parcela}. O boleto continua o mesmo (o Asaas atualiza a data); os lembretes recomeçam.</p>
              <input type="date" min={hoje()} value={campo.data} onChange={(e) => setCampo({ ...campo, data: e.target.value })} className="min-h-[44px] w-full rounded-xl border border-gray-200 px-3" />
              <button type="button" disabled={!!rodando || !campo.data} onClick={() => executar('v', { action: 'mudar_vencimento', parcela_id: acao.parcela.id, data: campo.data, avisar: true }, 'Vencimento alterado e boleto reenviado')} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#9C1E1E] text-sm font-bold text-white disabled:opacity-50">{rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Salvar e reenviar</button>
            </div>
          )}
          {acao?.tipo === 'pago' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Use só para pagamento recebido fora do boleto (dinheiro, transferência…). O boleto é baixado no Asaas como recebido e não pode mais ser pago.</p>
              <textarea value={campo.descricao} onChange={(e) => setCampo({ ...campo, descricao: e.target.value })} rows={3} placeholder="Como foi pago? Ex.: dinheiro em mãos para Jeferson em 29/10" className="w-full rounded-xl border border-gray-200 p-3 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-gray-500">Data<input type="date" max={hoje()} value={campo.data} onChange={(e) => setCampo({ ...campo, data: e.target.value })} className="mt-1 min-h-[44px] w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900" /></label>
                <label className="text-xs text-gray-500">Valor recebido<input inputMode="decimal" value={campo.valor} onChange={(e) => setCampo({ ...campo, valor: e.target.value })} className="mt-1 min-h-[44px] w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900" /></label>
              </div>
              <button type="button" disabled={!!rodando || campo.descricao.trim().length < 5} onClick={() => executar('p', { action: 'marcar_pago', parcela_id: acao.parcela.id, descricao: campo.descricao.trim(), data: campo.data, valor: Number(String(campo.valor).replace(',', '.')) }, 'Parcela marcada como paga')} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#9C1E1E] text-sm font-bold text-white disabled:opacity-50">{rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirmar pagamento</button>
            </div>
          )}
          {acao?.tipo === 'confianca' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">O pedido fica ativo por 5 dias enquanto o pagamento compensa. Se até lá o pagamento não for identificado, o sistema suspende de novo. A Sofia avisa o cliente e o financeiro.</p>
              <textarea value={campo.motivo} onChange={(e) => setCampo({ ...campo, motivo: e.target.value })} rows={2} placeholder="Motivo (ex.: pagou o boleto ontem, aguardando compensação)" className="w-full rounded-xl border border-gray-200 p-3 text-sm" />
              <button type="button" disabled={!!rodando || campo.motivo.trim().length < 3} onClick={() => executar('c', { action: 'confianca', pedido_id: pedidoId, motivo: campo.motivo.trim() }, 'Pedido ativado por confiança')} className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-50">{rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Ativar por 5 dias</button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CobrancaPedidoAdmin;
