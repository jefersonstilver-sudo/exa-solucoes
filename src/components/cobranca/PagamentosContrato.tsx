import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Copy, ExternalLink, Gift, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Área do cliente · aba Contrato — mensalidades do contrato (06/11/2026).
 * Mostra as parcelas que a equipe liberou na auditoria de cobrança (cobranca_auditoria.visivel_cliente):
 * pagas com o comprovante, cortesia, em aberto e as próximas. Só leitura: não gera cobrança nem avisa ninguém.
 */
type Parcela = {
  numero: number; competencia: string | null; data_vencimento: string; valor: number; situacao: string; dias_atraso: number;
  pago_em: string | null; valor_pago: number | null; comprovante_url: string | null; pix_transacao_id: string | null;
};
const CARD = 'rounded-[20px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '');
const mesLongo = (p: Parcela) => {
  const d = new Date(String(p.data_vencimento).slice(0, 10) + 'T12:00:00Z');
  const m = d.toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' });
  return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getUTCFullYear();
};

export const usePagamentosContrato = (pedidoId?: string | null) => {
  const [dados, setDados] = useState<{ parcelas: Parcela[]; resumo: any; plano?: any } | null>(null);
  useEffect(() => {
    if (!pedidoId) return;
    let vivo = true;
    supabase.functions.invoke('exa2-auditoria-cobranca', { body: { action: 'cliente', pedido_id: pedidoId } })
      .then(({ data }) => { if (vivo && data?.ok) setDados({ parcelas: data.parcelas || [], resumo: data.resumo, plano: data.plano }); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [pedidoId]);
  return dados;
};

const Chip: React.FC<{ p: Parcela }> = ({ p }) => {
  const base = 'rounded-full px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap';
  if (p.situacao === 'pago') return <span className={`${base} bg-[#e6f6ec] text-[#13a24a]`}>Paga</span>;
  if (p.situacao === 'cortesia') return <span className={`${base} bg-amber-50 text-amber-700`}>Cortesia</span>;
  if (p.situacao === 'atrasado') return <span className={`${base} bg-red-50 text-red-700`}>Em aberto</span>;
  if (p.situacao === 'perdoado') return <span className={`${base} bg-blue-50 text-blue-700`}>Isenta</span>;
  return <span className={`${base} bg-[#f3f1f2] text-[#8b8285]`}>A vencer</span>;
};

const PagamentosContrato: React.FC<{ dados: ReturnType<typeof usePagamentosContrato> }> = ({ dados }) => {
  const [todas, setTodas] = useState(false);
  if (!dados || !dados.parcelas.length) return null;
  const r = dados.resumo || {};
  const ps = dados.parcelas;
  const pagas = ps.filter((p) => p.situacao === 'pago').length;
  const contaveis = ps.filter((p) => !['cortesia', 'perdoado', 'cancelado'].includes(p.situacao)).length;
  const pct = contaveis ? Math.round((pagas / contaveis) * 100) : 0;
  // mostra tudo até a próxima a vencer; o resto fica atrás de "ver todas"
  const iProx = ps.findIndex((p) => p.situacao === 'a_vencer');
  const visiveis = todas || iProx < 0 ? ps : ps.slice(0, iProx + 1);

  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f1f2] text-[#554e50]"><Receipt className="h-5 w-5" /></span>
          <div className="mr-auto">
            <h2 className="text-[17px] font-extrabold tracking-tight text-[#1b1719]">Mensalidades</h2>
            <p className="text-[12.5px] text-[#8b8285]">{r.valor_mensal ? `${brl(r.valor_mensal)} por mês` : 'Seu plano mês a mês'}{dados.plano?.inicio ? ` · desde ${dataBR(dados.plano.inicio)}` : ''}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
            <span className="font-semibold text-[#554e50]">{pagas} de {contaveis} mensalidades pagas</span>
            <span className="font-bold text-[#1b1719]">{brl(r.pago || 0)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#1b1719]/[0.06]">
            <div className="h-full rounded-full bg-[#13a24a] transition-[width] duration-700" style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
        </div>
      </div>

      <ul className="divide-y divide-[#f1edee] border-t border-[#f1edee]">
        {visiveis.map((p) => (
          <li key={p.numero} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${p.situacao === 'pago' ? 'bg-[#e6f6ec] text-[#13a24a]' : p.situacao === 'cortesia' ? 'bg-amber-50 text-amber-700' : 'bg-[#f3f1f2] text-[#8b8285]'}`}>
              {p.situacao === 'pago' ? <CheckCircle2 className="h-[18px] w-[18px]" /> : p.situacao === 'cortesia' ? <Gift className="h-4 w-4" /> : <span className="text-[12px] font-bold">{p.numero}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-[#1b1719]">{mesLongo(p)}</div>
              <div className="text-[12.5px] text-[#8b8285]">
                <span className={p.situacao === 'cortesia' ? 'line-through' : ''}>{brl(p.valor)}</span>
                {p.situacao === 'pago' ? ` · paga em ${p.pago_em ? new Date(p.pago_em).toLocaleDateString('pt-BR') : ''}` : p.situacao === 'cortesia' ? ' · mês de cortesia' : ` · vence ${dataBR(p.data_vencimento)}`}
              </div>
              {p.situacao === 'pago' && p.pix_transacao_id && (
                <button type="button" onClick={() => navigator.clipboard?.writeText(p.pix_transacao_id!).then(() => toast.success('ID do Pix copiado')).catch(() => {})} className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-[#a39a9d]">
                  <Copy className="h-3 w-3 shrink-0" /> <span className="truncate">Pix {p.pix_transacao_id}</span>
                </button>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Chip p={p} />
              {p.situacao === 'pago' && p.comprovante_url && (
                <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#9C1E1E]">
                  Comprovante <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {!todas && iProx >= 0 && iProx < ps.length - 1 && (
        <button type="button" onClick={() => setTodas(true)} className="flex w-full items-center justify-center gap-1 border-t border-[#f1edee] py-3 text-[13px] font-bold text-[#554e50]">
          Ver as próximas {ps.length - iProx - 1} mensalidades <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </section>
  );
};

export default PagamentosContrato;
