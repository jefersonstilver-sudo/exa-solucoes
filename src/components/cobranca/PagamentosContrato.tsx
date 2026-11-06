import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Barcode, CheckCircle2, ChevronDown, Clapperboard, Copy, ExternalLink, FileDown, Gift, Loader2, QrCode, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * Área do cliente · aba Contrato — mensalidades do contrato (06/11/2026).
 * Parcelas que a equipe liberou na auditoria de cobrança (cobranca_auditoria.visivel_cliente): pagas (com comprovante),
 * cortesia, em atraso (com os dias) e só a PRÓXIMA a vencer. O cliente paga cada uma por Pix ou boleto (valor cheio)
 * ou todas as atrasadas num Pix único com desconto. Nada é enviado a ninguém: o pagamento é gerado só quando ele pede,
 * e a baixa é automática pelo ID da cobrança no Asaas (função exa2-auditoria-cobranca).
 */
type Parcela = {
  numero: number; competencia: string | null; data_vencimento: string; valor: number; situacao: string; dias_atraso: number;
  pago_em: string | null; valor_pago: number | null; comprovante_url: string | null; pix_transacao_id: string | null; em_cobranca?: boolean;
  periodo_inicio?: string | null; periodo_fim?: string | null; observacao?: string | null; pagador?: string | null;
};
type Cobranca = { id: string; forma: 'pix' | 'boleto'; valor: number; vencimento: string; parcelas: number[]; desconto_pct: number; pix_copia_cola?: string | null; pix_qr_base64?: string | null; boleto_url?: string | null; linha_digitavel?: string | null; invoice_url?: string | null };
type Dados = { parcelas: Parcela[]; resumo: any; plano?: any; cobrancas_abertas?: Cobranca[]; sofia_videos?: number; desconto_atrasadas?: number };

const CARD = 'rounded-[20px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '');
const mesLongo = (p: Parcela) => {
  // o mês da mensalidade é o do início do período (pagamento adiantado não muda o mês de referência)
  const d = new Date(String(p.periodo_inicio || p.data_vencimento).slice(0, 10) + 'T12:00:00Z');
  const m = d.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
  return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getUTCFullYear();
};
/** Período coberto pela mensalidade: início do plano + (n-1) meses até a véspera do mês seguinte (ex.: 15/05/2026 a 14/06/2026). */
const somaMeses = (iso: string, n: number) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const alvo = new Date(Date.UTC(y, m - 1 + n, 1));
  const ultimo = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimo));
  return alvo;
};
const periodoDa = (p: Parcela, inicioPlano?: string | null) => {
  if (p.periodo_inicio && p.periodo_fim) return `${dataBR(p.periodo_inicio)} a ${dataBR(p.periodo_fim)}`; // período gravado na parcela (ex.: cortesia de dias)
  const base = String(inicioPlano || p.data_vencimento).slice(0, 10);
  const de = inicioPlano ? somaMeses(base, p.numero - 1) : somaMeses(base, 0);
  const ate = somaMeses(de.toISOString(), 1); ate.setUTCDate(ate.getUTCDate() - 1);
  const f = (d: Date) => d.toISOString().slice(0, 10).split('-').reverse().join('/');
  return `${f(de)} a ${f(ate)}`;
};
const copiar = (t: string, rotulo: string) => navigator.clipboard?.writeText(t).then(() => toast.success(`${rotulo} copiado`)).catch(() => toast.error('Não consegui copiar.'));

export const usePagamentosContrato = (pedidoId?: string | null) => {
  const [dados, setDados] = useState<Dados | null>(null);
  const ler = useCallback(async () => {
    if (!pedidoId) return;
    try {
      const { data } = await supabase.functions.invoke('exa2-auditoria-cobranca', { body: { action: 'cliente', pedido_id: pedidoId } });
      if (data?.ok) setDados({ parcelas: data.parcelas || [], resumo: data.resumo, plano: data.plano, cobrancas_abertas: data.cobrancas_abertas || [], sofia_videos: data.sofia_videos || 0, desconto_atrasadas: data.desconto_atrasadas || 0 });
    } catch { /* sem dados: a seção não aparece */ }
  }, [pedidoId]);
  useEffect(() => { ler(); const t = setInterval(ler, 60000); return () => clearInterval(t); }, [ler]);
  return { dados, recarregar: ler, pedidoId: pedidoId || '' };
};

// cores da linha inteira por situação
const LINHA: Record<string, { fundo: string; icone: string; titulo: string; sub: string }> = {
  pago: { fundo: 'bg-gradient-to-r from-[#ecf9f0] to-[#f6fcf8]', icone: 'bg-[#13a24a] text-white', titulo: 'text-[#0f5f2d]', sub: 'text-[#3f8a5b]' },
  cortesia: { fundo: 'bg-gradient-to-r from-[#fbf3dc] to-[#fdf9ee]', icone: 'bg-gradient-to-br from-[#d9a93a] to-[#b8862b] text-white', titulo: 'text-[#7a5a14]', sub: 'text-[#9a7a2e]' },
  atrasado: { fundo: 'bg-gradient-to-r from-[#fdecec] to-[#fef6f6]', icone: 'bg-[#c62828] text-white', titulo: 'text-[#8e1b1b]', sub: 'text-[#b23b3b]' },
  a_vencer: { fundo: 'bg-white', icone: 'bg-[#f3f1f2] text-[#554e50]', titulo: 'text-[#1b1719]', sub: 'text-[#8b8285]' },
  perdoado: { fundo: 'bg-[#f4f7fd]', icone: 'bg-[#2557c7] text-white', titulo: 'text-[#1c3f8f]', sub: 'text-[#5a74b0]' },
};

const PagamentosContrato: React.FC<{ estado: ReturnType<typeof usePagamentosContrato>; relatorio?: any }> = ({ estado, relatorio }) => {
  const { dados, recarregar } = estado;
  const [aberto, setAberto] = useState(false);
  const [gerando, setGerando] = useState<string | null>(null);
  const [cobranca, setCobranca] = useState<Cobranca | null>(null);
  if (!dados || !dados.parcelas.length) return null;
  const r = dados.resumo || {};
  const ps = dados.parcelas;
  const atrasadas = ps.filter((p) => p.situacao === 'atrasado');
  const totalAtras = atrasadas.reduce((a, p) => a + Number(p.valor), 0);
  const desc = Number(dados.desconto_atrasadas || 0);
  const comDesc = Math.round(totalAtras * (1 - desc / 100) * 100) / 100;
  const contaveis = (r.qtd_pagas || 0) + (r.qtd_atrasadas || 0) + (r.qtd_a_vencer || 0);
  const pct = contaveis ? Math.round(((r.qtd_pagas || 0) / contaveis) * 100) : 0;

  const pagar = async (chave: string, body: Record<string, unknown>) => {
    setGerando(chave);
    try {
      const { data, error } = await supabase.functions.invoke('exa2-auditoria-cobranca', { body: { action: 'cliente_pagar', ...body } });
      if (error || !data?.ok) throw new Error(data?.erro || 'Não consegui gerar agora. Tente de novo em instantes.');
      if (data.ja_pago) { toast.success('Pagamento identificado!'); await recarregar(); }
      else { setCobranca(data.cobranca); await recarregar(); }
    } catch (e: any) { toast.error(e.message); }
    setGerando(null);
  };
  const btnPix = 'inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#1b1719] px-3 text-[12px] font-bold text-white transition active:scale-[.97] disabled:opacity-50';
  const btnBol = 'inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-[#1b1719]/15 bg-white px-3 text-[12px] font-bold text-[#1b1719] transition active:scale-[.97] disabled:opacity-50';

  // vídeos inclusos no plano (do relatório do pedido)
  const vids: any[] = relatorio?.videos || [];
  const nCinema = vids.filter((v) => v.serie === 'cinema' && v.id !== '__inicio').length;
  const nHotel = vids.filter((v) => v.serie === 'hotel').length;
  const nSofia = Number(dados.sofia_videos || 0);

  return (
    <>
      <section className={`${CARD} overflow-hidden`}>
        <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="flex min-h-[64px] w-full items-center gap-3 px-4 text-left sm:px-5">
          <span className="relative flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f3f1f2] text-[#554e50]">
            <QrCode className="h-5 w-5" />
            {atrasadas.length > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c62828] px-1 text-[10.5px] font-extrabold text-white ring-2 ring-white">{atrasadas.length}</span>}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-extrabold tracking-tight text-[#1b1719]">Mensalidades</span>
              {atrasadas.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecec] px-2 py-0.5 text-[11px] font-bold text-[#c62828]"><AlertCircle className="h-3 w-3" /> {atrasadas.length} em atraso</span>}
            </span>
            <span className="block text-[12.5px] text-[#8b8285]">{r.valor_mensal ? `${brl(r.valor_mensal)} por mês` : 'Seu plano mês a mês'} · {r.qtd_pagas || 0} de {contaveis} pagas</span>
          </span>
          <ChevronDown className={`h-5 w-5 flex-none text-[#8b8285] transition-transform duration-300 ${aberto ? 'rotate-180' : ''}`} />
        </button>

        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 sm:px-5">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#1b1719]/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#13a24a] to-[#3ccf72] transition-[width] duration-700" style={{ width: `${Math.max(2, pct)}%` }} />
              </div>
              {atrasadas.length > 1 && desc > 0 && (
                <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b1719] to-[#3a2a2e] p-4 text-white">
                  <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#f4cfd3]"><Sparkles className="h-3.5 w-3.5" /> Condição especial</div>
                  <div className="mt-1 text-[15px] font-extrabold">Quite as {atrasadas.length} mensalidades em aberto com {desc}% de desconto</div>
                  <div className="mt-1 text-[13px] text-white/75"><span className="line-through">{brl(totalAtras)}</span> <span className="ml-1 text-[18px] font-extrabold text-white">{brl(comDesc)}</span> num Pix único</div>
                  <button type="button" disabled={!!gerando} onClick={() => pagar('todas', { pedido_id: estado.pedidoId, atrasadas: true, forma: 'pix' })} className="mt-3 inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white px-4 text-[13px] font-extrabold text-[#1b1719] active:scale-[.98] disabled:opacity-60">
                    {gerando === 'todas' ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />} Pagar com Pix · {brl(comDesc)}
                  </button>
                </div>
              )}
            </div>

            <ul className="space-y-2 px-3 pb-3 sm:px-4">
              {ps.map((p) => {
                const c = LINHA[p.situacao] || LINHA.a_vencer;
                const pode = p.situacao === 'atrasado' || p.situacao === 'a_vencer';
                return (
                  <li key={p.numero} className={`rounded-2xl ${c.fundo} p-3 ${p.situacao === 'a_vencer' ? 'ring-1 ring-[#1b1719]/[0.07]' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${c.icone}`}>
                        {p.situacao === 'pago' ? <CheckCircle2 className="h-5 w-5" /> : p.situacao === 'cortesia' ? <Gift className="h-[18px] w-[18px]" /> : p.situacao === 'atrasado' ? <AlertCircle className="h-5 w-5" /> : <span className="text-[13px] font-extrabold">{p.numero}</span>}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[14.5px] font-extrabold ${c.titulo}`}>{mesLongo(p)}</div>
                        <div className={`text-[11.5px] font-semibold tabular-nums ${c.sub} opacity-90`}>Período {periodoDa(p, dados.plano?.inicio)}</div>
                        <div className={`text-[12.5px] ${c.sub}`}>
                          {p.situacao === 'cortesia' ? <><span className="line-through">{brl(p.valor)}</span> · {p.observacao ? p.observacao.replace(/^Cortesia\s*·\s*/i, 'cortesia · ') : 'cortesia EXA'}</> :
                            p.situacao === 'pago' ? <>{brl(p.valor_pago || p.valor)} · paga em {p.pago_em ? new Date(p.pago_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''}{p.pagador ? ` · por ${p.pagador}` : ''}</> :
                            p.situacao === 'atrasado' ? <>{brl(p.valor)} · vencida há <b>{p.dias_atraso} {p.dias_atraso === 1 ? 'dia' : 'dias'}</b></> :
                            <>{brl(p.valor)} · vence {dataBR(p.data_vencimento)}</>}
                        </div>
                      </div>
                      {p.situacao === 'pago' && p.comprovante_url && (
                        <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[34px] flex-none items-center gap-1 rounded-full bg-white/80 px-3 text-[12px] font-bold text-[#0f5f2d] ring-1 ring-[#13a24a]/20">
                          Comprovante <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {p.situacao === 'cortesia' && <span className="flex-none rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] font-extrabold text-[#9a6f12] ring-1 ring-[#d9a93a]/30">Cortesia</span>}
                    </div>
                    {p.situacao === 'pago' && p.pix_transacao_id && (
                      <button type="button" onClick={() => copiar(p.pix_transacao_id!, 'ID do Pix')} className="ml-[52px] mt-1 inline-flex max-w-[calc(100%-52px)] items-center gap-1 truncate text-[11px] text-[#5d9a73]">
                        <Copy className="h-3 w-3 flex-none" /> <span className="truncate">Pix {p.pix_transacao_id}</span>
                      </button>
                    )}
                    {pode && (
                      <div className="ml-[52px] mt-2 flex flex-wrap gap-2">
                        <button type="button" disabled={!!gerando} onClick={() => pagar('p' + p.numero, { pedido_id: estado.pedidoId, numero: p.numero, forma: 'pix' })} className={btnPix}>
                          {gerando === 'p' + p.numero ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />} Pagar com Pix
                        </button>
                        <button type="button" disabled={!!gerando} onClick={() => pagar('b' + p.numero, { pedido_id: estado.pedidoId, numero: p.numero, forma: 'boleto' })} className={btnBol}>
                          {gerando === 'b' + p.numero ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Barcode className="h-3.5 w-3.5" />} Gerar boleto
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {(nCinema > 0 || nHotel > 0 || nSofia > 0) && (
        <section className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f3f1f2] text-[#554e50]"><Clapperboard className="h-5 w-5" /></span>
            <div>
              <h2 className="text-[15px] font-extrabold tracking-tight text-[#1b1719]">Criação de vídeos inclusa no plano</h2>
              <p className="text-[12.5px] text-[#8b8285]">Feitos pela equipe EXA, sem custo extra</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              [nCinema, nCinema === 1 ? 'programação do cinema' : 'programações do cinema'],
              [nHotel, nHotel === 1 ? 'vídeo do hotel' : 'vídeos do hotel'],
              [nSofia, nSofia === 1 ? 'vídeo pela Sofia' : 'vídeos pela Sofia'],
            ].map(([n, t]) => (
              <div key={String(t)} className="rounded-2xl bg-[#f8f6f7] p-3 text-center">
                <div className="text-[22px] font-extrabold tabular-nums text-[#1b1719]">{n as number}</div>
                <div className="text-[11.5px] leading-tight text-[#8b8285]">{t as string}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!cobranca} onOpenChange={(o) => !o && setCobranca(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader><DialogTitle>{cobranca?.forma === 'boleto' ? 'Seu boleto' : 'Pague com Pix'} · {brl(cobranca?.valor || 0)}</DialogTitle></DialogHeader>
          {cobranca && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#8b8285]">
                {cobranca.parcelas.length > 1 ? `${cobranca.parcelas.length} mensalidades` : 'Mensalidade'}{cobranca.desconto_pct ? ` com ${cobranca.desconto_pct}% de desconto` : ''} · vence {dataBR(cobranca.vencimento)}. Assim que o pagamento cair, a mensalidade aparece como paga aqui, sozinha.
              </p>
              {cobranca.forma === 'pix' && cobranca.pix_qr_base64 && <img src={`data:image/png;base64,${cobranca.pix_qr_base64}`} alt="QR Code do Pix" className="mx-auto h-52 w-52 rounded-xl" />}
              {cobranca.pix_copia_cola && (
                <button type="button" onClick={() => copiar(cobranca.pix_copia_cola!, 'Pix copia e cola')} className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1b1719] text-[14px] font-bold text-white">
                  <Copy className="h-4 w-4" /> Copiar Pix copia e cola
                </button>
              )}
              {cobranca.forma === 'boleto' && cobranca.linha_digitavel && (
                <button type="button" onClick={() => copiar(cobranca.linha_digitavel!, 'Linha digitável')} className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#1b1719]/15 text-[14px] font-bold text-[#1b1719]">
                  <Barcode className="h-4 w-4" /> Copiar linha digitável
                </button>
              )}
              {cobranca.forma === 'boleto' && cobranca.boleto_url && (
                <a href={cobranca.boleto_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-[#1b1719]/15 text-[14px] font-bold text-[#1b1719]">
                  <FileDown className="h-4 w-4" /> Baixar boleto (PDF)
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PagamentosContrato;
