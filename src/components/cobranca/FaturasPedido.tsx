import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, FileDown, Receipt, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * EXA 2.0 — Faturas do pedido (área do cliente).
 * Boletos mensais com Pix no próprio boleto: 2ª via em PDF, Pix copia e cola e linha digitável.
 * Lê direto a tabela `parcelas` (o cliente só enxerga as do próprio pedido pela regra de acesso do banco).
 */
export interface ParcelaCobranca {
  id: string;
  numero_parcela: number;
  data_vencimento: string;
  valor_final: number;
  valor_multa?: number | null;
  status: string;
  forma?: string | null;
  boleto_url?: string | null;
  asaas_invoice_url?: string | null;
  boleto_barcode?: string | null;
  pix_qr_code?: string | null;
  data_pagamento?: string | null;
}

const CARD = 'rounded-[20px] bg-white shadow-[0_1px_2px_rgba(30,15,18,.05),0_8px_24px_-14px_rgba(30,15,18,.16)]';
const brl = (v: number) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataBR = (s?: string | null) => (s ? String(s).slice(0, 10).split('-').reverse().join('/') : '');
const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const dias = (ymd: string) => Math.round((new Date(ymd + 'T12:00:00Z').getTime() - new Date(hoje() + 'T12:00:00Z').getTime()) / 86400e3);

export const useParcelas = (pedidoId?: string | null) => {
  const [parcelas, setParcelas] = useState<ParcelaCobranca[] | null>(null);
  const ler = useCallback(async () => {
    if (!pedidoId) return;
    const { data } = await (supabase as any)
      .from('parcelas')
      .select('id,numero_parcela,data_vencimento,valor_final,valor_multa,status,forma,boleto_url,asaas_invoice_url,boleto_barcode,pix_qr_code,data_pagamento')
      .eq('pedido_id', pedidoId)
      .order('numero_parcela');
    setParcelas((data as ParcelaCobranca[]) || []);
  }, [pedidoId]);
  useEffect(() => { ler(); const t = setInterval(ler, 60000); return () => clearInterval(t); }, [ler]);
  return { parcelas, recarregar: ler };
};

const copiar = async (txt: string, rotulo: string) => {
  try { await navigator.clipboard.writeText(txt); toast.success(`${rotulo} copiado`); }
  catch { toast.error('Não consegui copiar. Segure o texto para copiar.'); }
};

const Situacao: React.FC<{ p: ParcelaCobranca }> = ({ p }) => {
  if (p.status === 'pago') return <span className="rounded-full bg-[#e6f6ec] px-2 py-0.5 text-[11px] font-bold text-[#13a24a]">Paga{p.data_pagamento ? ` · ${new Date(p.data_pagamento).toLocaleDateString('pt-BR')}` : ''}</span>;
  const d = dias(p.data_vencimento);
  if (d < 0 || p.status === 'atrasado') return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">Vencida há {Math.max(1, -d)} {-d === 1 ? 'dia' : 'dias'}</span>;
  if (!p.boleto_url) return <span className="rounded-full bg-[#f3f1f2] px-2 py-0.5 text-[11px] font-bold text-[#8b8285]">Boleto sai 10 dias antes</span>;
  if (d === 0) return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Vence hoje</span>;
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Em aberto · vence em {d} {d === 1 ? 'dia' : 'dias'}</span>;
};

const AcoesPagamento: React.FC<{ p: ParcelaCobranca }> = ({ p }) => (
  <div className="grid gap-2 sm:grid-cols-3">
    {p.boleto_url && (
      <a href={p.boleto_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] bg-[#9C1E1E] px-4 text-sm font-bold text-white">
        <FileDown className="h-4 w-4" /> Boleto (PDF)
      </a>
    )}
    {p.pix_qr_code && (
      <button type="button" onClick={() => copiar(p.pix_qr_code!, 'Pix copia e cola')} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-[#e6dfe1] bg-white px-4 text-sm font-bold text-[#1b1719]">
        <Copy className="h-4 w-4" /> Copiar Pix
      </button>
    )}
    {p.boleto_barcode && (
      <button type="button" onClick={() => copiar(p.boleto_barcode!, 'Linha digitável')} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-[#e6dfe1] bg-white px-4 text-sm font-semibold text-[#1b1719]">
        <Copy className="h-4 w-4" /> Linha digitável
      </button>
    )}
  </div>
);

/** Aviso no topo do pedido: boleto vencido, suspensão por falta de pagamento ou ativação de confiança. */
export const AvisoCobranca: React.FC<{ pedido: any; parcelas: ParcelaCobranca[] | null }> = ({ pedido, parcelas }) => {
  if (!parcelas) return null;
  const vencida = parcelas.find((p) => p.status !== 'pago' && (p.status === 'atrasado' || dias(p.data_vencimento) < 0));
  const suspenso = pedido?.status === 'bloqueado' && /falta de pagamento|pagamento não identificado/i.test(String(pedido?.blocked_reason || ''));
  const confianca = pedido?.confianca_ate && new Date(pedido.confianca_ate).getTime() > Date.now();
  if (confianca && !suspenso) {
    return (
      <div className="flex items-start gap-3 rounded-[18px] border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-none" />
        <p>Seu pedido está ativo por confiança até <b>{new Date(pedido.confianca_ate).toLocaleDateString('pt-BR')}</b>, enquanto o pagamento compensa.</p>
      </div>
    );
  }
  if (!vencida && !suspenso) return null;
  const alvo = vencida || parcelas.find((p) => p.status !== 'pago' && p.boleto_url) || null;
  const faltam = vencida ? 10 + dias(vencida.data_vencimento) : 0;
  return (
    <div className={`space-y-3 rounded-[18px] border p-4 ${suspenso ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 flex-none ${suspenso ? 'text-red-600' : 'text-amber-600'}`} />
        <div className={`text-sm ${suspenso ? 'text-red-900' : 'text-amber-900'}`}>
          {suspenso ? (
            <><b>Pedido suspenso por falta de pagamento.</b> Os vídeos saíram das telas e não é possível criar vídeos novos. Assim que o pagamento entrar, o pedido volta sozinho em poucos minutos.</>
          ) : (
            <><b>Boleto vencido em {dataBR(vencida!.data_vencimento)}</b> ({brl(vencida!.valor_final)}). {faltam > 0 ? `Pague em até ${faltam} ${faltam === 1 ? 'dia' : 'dias'} para o pedido não ser suspenso.` : 'O pedido pode ser suspenso a qualquer momento.'} Pelo Pix do boleto cai na hora.</>
          )}
        </div>
      </div>
      {alvo && <AcoesPagamento p={alvo} />}
    </div>
  );
};

/** Lista de parcelas (aba Contrato). Só aparece para pedidos cobrados por boleto ou com parcela em aberto. */
export const FaturasPedido: React.FC<{ pedido: any; parcelas: ParcelaCobranca[] | null }> = ({ pedido, parcelas }) => {
  const [aberta, setAberta] = useState<string | null>(null);
  if (!parcelas || !parcelas.length) return null;
  const boleto = pedido?.forma_cobranca === 'boleto' || parcelas.some((p) => p.forma === 'boleto');
  if (!boleto) return null;
  const proxima = parcelas.find((p) => p.status !== 'pago' && p.boleto_url);
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-3 p-4 sm:p-5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#f8e9ec] text-[#9e1b34]"><Receipt className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold tracking-tight text-[#1b1719]">Boletos</h2>
          <p className="text-[12.5px] text-[#8b8285]">Vencimento todo dia {pedido?.dia_vencimento || '—'} · chegam por e-mail 10 dias antes</p>
        </div>
      </div>
      {proxima && (
        <div className="space-y-3 border-t border-[#f1edee] bg-[#fdf9f9] p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-[#1b1719]">Parcela {proxima.numero_parcela} · vence {dataBR(proxima.data_vencimento)}</span>
            <span className="text-base font-extrabold text-[#1b1719]">{brl(proxima.valor_final)}</span>
          </div>
          <AcoesPagamento p={proxima} />
          <p className="text-xs text-[#8b8285]">Pelo Pix do boleto a confirmação é imediata; pelo código de barras leva até 3 dias úteis.</p>
        </div>
      )}
      <ul className="divide-y divide-[#f1edee] border-t border-[#f1edee]">
        {parcelas.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setAberta(aberta === p.id ? null : p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5" disabled={!p.boleto_url || p.status === 'pago'}>
              <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-extrabold ${p.status === 'pago' ? 'bg-[#e6f6ec] text-[#13a24a]' : 'bg-[#f3f1f2] text-[#554e50]'}`}>
                {p.status === 'pago' ? <Check className="h-3.5 w-3.5" /> : p.numero_parcela}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#1b1719]">{dataBR(p.data_vencimento)}</span>
                <Situacao p={p} />
              </span>
              <span className="text-sm font-bold text-[#1b1719]">{brl(p.valor_final)}</span>
            </button>
            {aberta === p.id && p.status !== 'pago' && p.boleto_url && <div className="px-4 pb-4 sm:px-5"><AcoesPagamento p={p} /></div>}
          </li>
        ))}
      </ul>
    </section>
  );
};
