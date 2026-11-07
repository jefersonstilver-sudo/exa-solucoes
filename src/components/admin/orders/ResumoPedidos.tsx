// EXA (07/11/2026) — resumo no topo da lista de pedidos, refeito a pedido do Jeferson (sem o quadrado vermelho).
// Regras: bloqueados, Conta Interna, editoriais e parcerias (R$ 0) NÃO entram na receita; o atraso vem da auditoria de cobrança.
import React, { useMemo } from 'react';
import { Tv2, TrendingUp, AlertTriangle, CalendarClock, Video, Lock } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { formatCurrency } from '@/utils/formatters';
import { usePedidosAtraso, ehContaInterna, ehEditorial } from '@/hooks/usePedidosAtraso';

const DIA = 86400_000;

const valorMensalDe = (p: OrderOrAttempt) =>
  p.valor_mensal && p.valor_mensal > 0 ? p.valor_mensal : p.plano_meses && p.plano_meses > 1 ? (p.valor_total || 0) / p.plano_meses : p.valor_total || 0;

interface Props { items: OrderOrAttempt[] }

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
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
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
