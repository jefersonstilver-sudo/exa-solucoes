// EXA (07/11/2026) — resumo no topo da lista de pedidos, refeito a pedido do Jeferson (sem o quadrado vermelho).
// Regras: bloqueados, Conta Interna, editoriais e parcerias (R$ 0) NÃO entram na receita; o atraso vem da auditoria de cobrança.
import React, { useMemo } from 'react';
import { Tv2, TrendingUp, AlertTriangle, CalendarClock, Video, Lock, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { formatCurrency } from '@/utils/formatters';
import { usePedidosAtraso, ehContaInterna, ehEditorial } from '@/hooks/usePedidosAtraso';

const DIA = 86400_000;

const valorMensalDe = (p: OrderOrAttempt) =>
  p.valor_mensal && p.valor_mensal > 0 ? p.valor_mensal : p.plano_meses && p.plano_meses > 1 ? (p.valor_total || 0) / p.plano_meses : p.valor_total || 0;

interface Props { items: OrderOrAttempt[] }

/** O que já ENTROU no mês: só linhas PAYMENT_RECEIVED do extrato do Asaas (espelho), pela data do movimento. Nunca inferido de pedido. */
const useRecebidoNoMes = () =>
  useQuery({
    queryKey: ['recebido-no-mes'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
      const fim = hoje.toISOString().slice(0, 10);
      let total = 0, n = 0;
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('asaas_extrato_movimentos').select('valor').eq('tipo', 'PAYMENT_RECEIVED').gte('data', ini).lte('data', fim).order('ordem_asaas', { ascending: true }).range(offset, offset + 499);
        if (error || !data) return { total: null as number | null, n: 0 };
        total += data.reduce((a, r: any) => a + Number(r.valor || 0), 0); n += data.length;
        if (data.length < 500) return { total, n };
      }
    },
  });

const Cartao: React.FC<{ rotulo: string; valor: React.ReactNode; sub?: React.ReactNode; cor?: string; icone: React.ElementType }> = ({ rotulo, valor, sub, cor = '#17181A', icone: Icone }) => (
  <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white/80 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(70,20,20,0.3)] backdrop-blur-xl">
    <Icone className="absolute right-3.5 top-3.5 h-4 w-4 text-black/20" aria-hidden="true" />
    <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">{rotulo}</span>
    <span className="mt-1 block text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums" style={{ color: cor }}>{valor}</span>
    {sub && <span className="mt-1.5 block truncate text-[12px] font-semibold text-[#8A8B90]">{sub}</span>}
  </div>
);

const ResumoPedidos: React.FC<Props> = ({ items }) => {
  const { data: atrasos } = usePedidosAtraso();
  const { data: recebido } = useRecebidoNoMes();
  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
  const r = useMemo(() => {
    const agora = Date.now();
    const pedidos = items.filter((i) => i.type === 'order');
    const bloqueados = pedidos.filter((p) => p.status === 'bloqueado');
    const vivos = pedidos.filter((p) => p.status !== 'bloqueado' && !['cancelado', 'cancelado_automaticamente', 'finalizado'].includes(p.status));
    const noAr = vivos.filter((p) => ['ativo', 'video_aprovado'].includes(p.status) && (!p.data_fim || new Date(p.data_fim).getTime() > agora));
    const internos = noAr.filter((p) => ehContaInterna(p) || ehEditorial(p));
    const pagantes = noAr.filter((p) => !ehContaInterna(p) && !ehEditorial(p) && valorMensalDe(p) > 1);
    const parcerias = noAr.filter((p) => !ehContaInterna(p) && !ehEditorial(p) && valorMensalDe(p) <= 1);
    const mrr = pagantes.reduce((a, p) => a + valorMensalDe(p), 0);
    const terminam = pagantes.concat(parcerias).filter((p) => p.data_fim && new Date(p.data_fim).getTime() - agora <= 30 * DIA);
    const terminamValor = terminam.reduce((a, p) => a + valorMensalDe(p), 0);
    const aguardando = vivos.filter((p) => ['aguardando_video', 'pago', 'pago_pendente_video', 'video_enviado', 'aguardando_contrato'].includes(p.status));
    let atrasoTotal = 0, atrasoClientes = 0, atrasoDias = 0;
    const ids = new Set(pedidos.map((p) => p.id));
    for (const a of atrasos?.values() || []) {
      if (!ids.has(a.pedido_id) || !a.valor_atraso) continue;
      atrasoTotal += a.valor_atraso; atrasoClientes += 1; atrasoDias = Math.max(atrasoDias, a.dias_atraso);
    }
    return { noAr, internos, pagantes, parcerias, mrr, terminam, terminamValor, aguardando, bloqueados, atrasoTotal, atrasoClientes, atrasoDias };
  }, [items, atrasos]);

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
      <Cartao rotulo={`Entrou em ${mesNome}`} icone={Wallet} cor="#1E6B47" valor={recebido?.total == null ? '—' : formatCurrency(recebido.total)}
        sub={recebido?.total == null ? 'extrato do Asaas indisponível' : `${recebido.n} recebimento${recebido.n === 1 ? '' : 's'} no Asaas`} />
      <Cartao rotulo="No ar" icone={Tv2} valor={r.pagantes.length}
        sub={`${r.parcerias.length} parceria${r.parcerias.length === 1 ? '' : 's'} · ${r.internos.length} da EXA`} />
      <Cartao rotulo="Receita mensal" icone={TrendingUp} cor="#1E6B47" valor={formatCurrency(r.mrr)}
        sub={`${r.pagantes.length} pedido${r.pagantes.length === 1 ? '' : 's'} pagando · sem bloqueados`} />
      <Cartao rotulo="Em atraso" icone={AlertTriangle} cor={r.atrasoTotal ? '#B0261D' : '#1E6B47'} valor={formatCurrency(r.atrasoTotal)}
        sub={r.atrasoTotal ? `${r.atrasoClientes} cliente${r.atrasoClientes === 1 ? '' : 's'} · o mais antigo há ${r.atrasoDias} dias` : 'ninguém em atraso'} />
      <Cartao rotulo="Terminam em 30 dias" icone={CalendarClock} cor={r.terminam.length ? '#9A5300' : '#17181A'} valor={r.terminam.length}
        sub={r.terminam.length ? `${formatCurrency(r.terminamValor)}/mês para renovar` : 'nenhum vencendo'} />
      <Cartao rotulo="Aguardando vídeo" icone={Video} valor={r.aguardando.length}
        sub={r.aguardando.length ? 'pagos ou em contrato, sem vídeo no ar' : 'fila vazia'} />
      <Cartao rotulo="Bloqueados" icone={Lock} cor="#8A8B90" valor={r.bloqueados.length} sub="fora da receita, no fim da lista" />
    </div>
  );
};

export default ResumoPedidos;
