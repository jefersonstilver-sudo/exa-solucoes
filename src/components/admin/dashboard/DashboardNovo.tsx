// EXA (07/11/2026) — Dashboard refeito (pedido do Jeferson): o que precisa ser visto, nada de vendedores, vouchers ou cartões
// arrastáveis. Cinco blocos: Hoje · Dinheiro · Comercial · Rede · Clientes no ar.
// Fontes únicas: telas = mesma conta da página Painéis EXA (só o grupo Prédios); pedidos = mesma regra da lista de pedidos
// (bloqueados, Conta Interna, editoriais e parcerias fora da receita); atraso = auditoria de cobrança; entrou no mês = extrato Asaas.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tv, CheckSquare, MessageCircle, Building2, AlertTriangle, Wallet, TrendingUp, CalendarClock, ClipboardList, ChevronRight, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FrotaPainel } from '@/modules/monitoramento-ia/hooks/useFrotaSaude';
import { useTelasDaRede } from '@/modules/monitoramento-ia/hooks/useTelasDaRede';
import { glass } from '@/modules/monitoramento-ia/components/paineis/estados';
import { SelosEstado } from '@/modules/monitoramento-ia/components/paineis/estadoVivo';
import { useAuth } from '@/hooks/useAuth';
import { useOrdersWithAttemptsRefactored } from '@/hooks/useOrdersWithAttemptsRefactored';
import { usePedidosAtraso, ehContaInterna, ehEditorial } from '@/hooks/usePedidosAtraso';
import { useRecebidoNoMes } from '@/hooks/useRecebidoNoMes';
import { formatCurrency } from '@/utils/formatters';
import type { OrderOrAttempt } from '@/types/ordersAndAttempts';

type ConvSofia = { id: string; name: string; phone: string | null; mode: 'auto' | 'humano'; last_message_at: string | null; preview: string; inclinacao?: number | null; inclinacao_motivo?: string | null };
type ConvNando = { telefone: string; nome: string; predio_atual: string | null; predios: { nome: string }[]; modo: 'auto' | 'humano'; ultima_em: string; preview: string; aguardando: number };

const DIA = 86400_000;
const hora = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso), hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (new Date(hoje.getTime() - DIA).toDateString() === d.toDateString()) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const limpa = (s?: string | null) => String(s || '').replace(/\s+/g, ' ').trim();
const ehHoje = (iso?: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
const valorMensalDe = (p: OrderOrAttempt) => (p.valor_mensal && p.valor_mensal > 0 ? p.valor_mensal : p.plano_meses && p.plano_meses > 1 ? (p.valor_total || 0) / p.plano_meses : p.valor_total || 0);

const Bloco: React.FC<{ titulo: string; acao?: { rotulo: string; to: string }; children: React.ReactNode; className?: string }> = ({ titulo, acao, children, className = '' }) => (
  <section className={`${glass} rounded-[22px] p-4 md:p-5 ${className}`}>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">{titulo}</h2>
      {acao && <Link to={acao.to} className="inline-flex h-8 items-center gap-1 text-[13px] font-bold text-[#9C1E1E]">{acao.rotulo} <ChevronRight className="h-3.5 w-3.5" /></Link>}
    </div>
    {children}
  </section>
);

const Kpi: React.FC<{ rotulo: string; valor: React.ReactNode; sub?: React.ReactNode; cor?: string; icone: React.ElementType; to?: string }> = ({ rotulo, valor, sub, cor = '#17181A', icone: I, to }) => {
  const inner = (
    <>
      <I className="absolute right-3.5 top-3.5 h-4 w-4 text-black/20" aria-hidden="true" />
      <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">{rotulo}</span>
      <span className={`mt-1 block font-extrabold leading-none tracking-[-0.03em] tabular-nums ${String(valor).length > 9 ? 'text-[20px] xl:text-[24px]' : 'text-[28px]'}`} style={{ color: cor }}>{valor}</span>
      {sub && <span className="mt-1.5 block truncate text-[12px] font-semibold text-[#8A8B90]">{sub}</span>}
    </>
  );
  const cls = `relative block overflow-hidden rounded-2xl bg-white/80 px-4 py-3.5 ring-1 ring-black/[0.05] ${to ? 'transition hover:bg-white' : ''}`;
  return to ? <Link to={to} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
};

export default function DashboardNovo() {
  const { pathname } = useLocation();
  const base = pathname.startsWith('/admin') ? '/admin' : '/super_admin';
  const { userProfile } = useAuth();
  const telas = useTelasDaRede();
  const { ordersAndAttempts } = useOrdersWithAttemptsRefactored();
  const { data: atrasos } = usePedidosAtraso();
  const { data: recebido } = useRecebidoNoMes();
  const [sofia, setSofia] = useState<ConvSofia[] | null>(null);
  const [nando, setNando] = useState<ConvNando[] | null>(null);
  const [aprovar, setAprovar] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    const [s, n, a] = await Promise.allSettled([
      supabase.functions.invoke('sofia-panel', { body: { action: 'list' } }),
      supabase.functions.invoke('nando-crm', { body: { action: 'list' } }),
      supabase.from('pedido_videos').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    ]);
    if (s.status === 'fulfilled' && !s.value.error) setSofia(((s.value.data as any)?.conversations || []) as ConvSofia[]); else setSofia((v) => v ?? []);
    if (n.status === 'fulfilled' && !n.value.error) setNando(((n.value.data as any)?.conversas || []) as ConvNando[]); else setNando((v) => v ?? []);
    if (a.status === 'fulfilled' && !(a.value as any).error) setAprovar((a.value as any).count ?? 0);
  }, []);
  useEffect(() => { carregar(); const t = window.setInterval(carregar, 60000); return () => window.clearInterval(t); }, [carregar]);

  const sindicos = useQuery({
    queryKey: ['dash-sindicos-novos'], staleTime: 60_000,
    queryFn: async () => { const { count } = await supabase.from('sindicos_interessados').select('id', { count: 'exact', head: true }).eq('status', 'novo'); return count || 0; },
  });

  // ===== Telas (mesma conta da página Painéis EXA) =====
  const ordemEstado: Record<string, number> = { sem_sinal: 0, sem_imagem: 1, internet_ruim: 2, instavel: 3, quente: 4 };
  const comProblema = telas.paineis.filter((p) => p.estado in ordemEstado).sort((a, b) => ordemEstado[a.estado] - ordemEstado[b.estado]);
  const quedas24 = telas.paineis.reduce((a, p) => a + (p.quedas_24h || 0), 0);

  // ===== Pedidos (mesma regra da lista) =====
  const ped = useMemo(() => {
    const agora = Date.now();
    const pedidos = ordersAndAttempts.filter((i) => i.type === 'order');
    const vivos = pedidos.filter((p) => p.status !== 'bloqueado' && !['cancelado', 'cancelado_automaticamente', 'finalizado'].includes(p.status));
    const noAr = vivos.filter((p) => ['ativo', 'video_aprovado'].includes(p.status) && (!p.data_fim || new Date(p.data_fim).getTime() > agora));
    const pagantes = noAr.filter((p) => !ehContaInterna(p) && !ehEditorial(p) && valorMensalDe(p) > 1);
    const parcerias = noAr.filter((p) => !ehContaInterna(p) && !ehEditorial(p) && valorMensalDe(p) <= 1);
    const mrr = pagantes.reduce((a, p) => a + valorMensalDe(p), 0);
    const terminam = [...pagantes, ...parcerias].filter((p) => p.data_fim && new Date(p.data_fim).getTime() - agora <= 30 * DIA).sort((a, b) => String(a.data_fim).localeCompare(String(b.data_fim)));
    const clientes = [...pagantes, ...parcerias].sort((a, b) => (atrasos?.get(b.id)?.valor_atraso || 0) - (atrasos?.get(a.id)?.valor_atraso || 0) || valorMensalDe(b) - valorMensalDe(a));
    const emAtraso = clientes.filter((p) => (atrasos?.get(p.id)?.valor_atraso || 0) > 0);
    const atrasoTotal = emAtraso.reduce((a, p) => a + (atrasos?.get(p.id)?.valor_atraso || 0), 0);
    const aguardando = vivos.filter((p) => ['aguardando_video', 'pago', 'pago_pendente_video', 'video_enviado', 'aguardando_contrato'].includes(p.status));
    return { pagantes, parcerias, mrr, terminam, clientes, emAtraso, atrasoTotal, aguardando };
  }, [ordersAndAttempts, atrasos]);

  // ===== Sofia =====
  const sofiaRecentes = (sofia || []).filter((c) => c.last_message_at).sort((a, b) => String(b.last_message_at).localeCompare(String(a.last_message_at)));
  const semResposta = (sofia || []).filter((c) => c.mode === 'humano').length;
  const quentes = (sofia || []).filter((c) => (c.inclinacao ?? -1) >= 60).sort((a, b) => (b.inclinacao || 0) - (a.inclinacao || 0)).slice(0, 5);
  const conversasHoje = (sofia || []).filter((c) => ehHoje(c.last_message_at)).length + (nando || []).filter((c) => ehHoje(c.ultima_em)).length;
  const nandoRecentes = (nando || []).slice().sort((a, b) => String(b.ultima_em).localeCompare(String(a.ultima_em))).slice(0, 4);

  const nome = (userProfile as any)?.nome?.split(' ')[0] || (userProfile as any)?.name?.split(' ')[0] || '';
  const h = new Date().getHours();
  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  const titulo = (p: OrderOrAttempt) => p.nome_pedido || p.empresa_nome || p.client_name || `Pedido #${p.id.slice(0, 8)}`;
  const diasRestantes = (p: OrderOrAttempt) => (p.data_fim ? Math.ceil((new Date(p.data_fim).getTime() - Date.now()) / DIA) : null);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-[#17181A] md:space-y-6" style={{ fontFeatureSettings: '"tnum"' }}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold text-[#6A6B70]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[30px]">{h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}{nome ? `, ${nome}` : ''}</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E6B47]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2E9B62]" />ao vivo · atualiza a cada minuto</span>
      </header>

      {/* 1. HOJE */}
      <section aria-label="Hoje" className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Telas no ar" icone={Tv} to={`${base}/paineis-exa`} valor={telas.carregando ? '–' : `${telas.noAr}/${telas.total}`}
          cor={comProblema.some((p) => p.estado === 'sem_sinal' || p.estado === 'sem_imagem') ? '#B0261D' : '#1E6B47'}
          sub={telas.carregando ? 'carregando' : comProblema.length ? `${comProblema.length} com alerta · ${quedas24} quedas em 24 h` : `sem alerta · ${quedas24} quedas em 24 h`} />
        <Kpi rotulo="Para aprovar" icone={CheckSquare} to={`${base}/aprovacoes`} valor={aprovar ?? '–'} cor={aprovar ? '#9C1E1E' : '#1E6B47'} sub={aprovar ? 'vídeos esperando a equipe' : 'nada na fila'} />
        <Kpi rotulo="Conversas hoje" icone={MessageCircle} to={`${base}/crm-evolution`} valor={sofia && nando ? conversasHoje : '–'} sub={semResposta ? `${semResposta} esperando você (modo humano)` : 'Sofia e Nando no automático'} cor={semResposta ? '#9A5300' : '#17181A'} />
        <Kpi rotulo="Síndicos novos" icone={ClipboardList} to={`${base}/sindicos-interessados`} valor={sindicos.data ?? '–'} cor={sindicos.data ? '#2B4C8C' : '#17181A'} sub={sindicos.data ? 'leads sem contato' : 'nenhum lead parado'} />
      </section>

      {/* 2. DINHEIRO */}
      <Bloco titulo="Dinheiro" acao={{ rotulo: 'Pedidos', to: `${base}/pedidos` }}>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Kpi rotulo={`Entrou em ${mesNome}`} icone={Wallet} cor="#1E6B47" valor={recebido?.total == null ? '—' : formatCurrency(recebido.total)} sub={recebido?.total == null ? 'extrato do Asaas indisponível' : `${recebido.n} recebimento${recebido.n === 1 ? '' : 's'} no Asaas`} />
          <Kpi rotulo="Receita mensal" icone={TrendingUp} cor="#1E6B47" valor={formatCurrency(ped.mrr)} sub={`${ped.pagantes.length} pagando · ${ped.parcerias.length} parcerias`} />
          <Kpi rotulo="Em atraso" icone={AlertTriangle} cor={ped.atrasoTotal ? '#B0261D' : '#1E6B47'} valor={formatCurrency(ped.atrasoTotal)} sub={ped.atrasoTotal ? ped.emAtraso.map(titulo).slice(0, 3).join(' · ') : 'ninguém em atraso'} />
          <Kpi rotulo="Terminam em 30 dias" icone={CalendarClock} cor={ped.terminam.length ? '#9A5300' : '#17181A'} valor={ped.terminam.length} sub={ped.terminam.length ? `${formatCurrency(ped.terminam.reduce((a, p) => a + valorMensalDe(p), 0))}/mês para renovar` : 'nenhum vencendo'} />
        </div>
      </Bloco>

      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {/* 3. COMERCIAL */}
        <Bloco titulo="Comercial · Sofia" acao={{ rotulo: 'Abrir conversas', to: `${base}/crm-evolution/conversas/sofia` }}>
          {sofia === null ? <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p> : (
            <>
              {quentes.length > 0 && (
                <div className="mb-3 rounded-2xl bg-[#FFF4E5] p-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9A5300]">Mais perto de fechar</div>
                  <ul className="mt-1 divide-y divide-black/[0.05]">
                    {quentes.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 py-1.5">
                        <span className="w-10 text-[15px] font-extrabold text-[#9A5300]">{c.inclinacao}%</span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{c.name || c.phone}</span>
                        <span className="hidden max-w-[45%] truncate text-[12px] text-[#6A6B70] sm:block">{c.inclinacao_motivo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!sofiaRecentes.length ? <p className="py-2 text-sm text-[#6A6B70]">Nenhuma conversa ainda.</p> : (
                <ul className="divide-y divide-black/[0.06]">
                  {sofiaRecentes.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <Link to={`${base}/crm-evolution/conversas/sofia${c.phone ? `?telefone=${encodeURIComponent(c.phone)}` : ''}`} className="flex items-start gap-3 py-2.5">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9C1E1E]/10 text-[13px] font-extrabold text-[#9C1E1E]">{(c.name || '?').trim().charAt(0).toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14.5px] font-bold">{c.name || c.phone || 'Sem nome'}</span>
                            {c.mode === 'humano' && <span className="shrink-0 rounded-full bg-[#EEF2FB] px-2 py-0.5 text-[10.5px] font-bold text-[#2B4C8C]">Você</span>}
                            <span className="ml-auto shrink-0 text-[12px] text-[#8A8B90]">{hora(c.last_message_at)}</span>
                          </span>
                          <span className="line-clamp-1 text-[13px] leading-snug text-[#5E5F63]">{limpa(c.preview)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Bloco>

        {/* 4. REDE */}
        <div className="space-y-5 md:space-y-6">
          <Bloco titulo="Rede · telas com alerta" acao={{ rotulo: 'Painéis EXA', to: `${base}/paineis-exa` }}>
            {telas.carregando ? <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p> : !comProblema.length ? (
              <p className="py-1 text-[15px] font-bold text-[#1E6B47]">Todas as {telas.total} telas dos prédios no ar, sem alerta.</p>
            ) : (
              <ul className="divide-y divide-black/[0.06]">
                {comProblema.slice(0, 6).map((p: FrotaPainel) => (
                  <li key={p.id}>
                    <Link to={`${base}/paineis-exa`} className="flex items-center gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold">{p.nome}</span>
                        <span className="block truncate text-[12px] text-[#6A6B70]">{p.operadora || 'Operadora ?'}{p.estado !== 'sem_sinal' ? ` · ${p.causa}` : ''}</span>
                      </span>
                      <SelosEstado estado={p.estado} desde={p.visto_anydesk_em} />
                    </Link>
                  </li>
                ))}
                {comProblema.length > 6 && <li className="pt-2 text-[13px] font-semibold text-[#6A6B70]">+ {comProblema.length - 6} com alerta</li>}
              </ul>
            )}
          </Bloco>
          <Bloco titulo="Nando · síndicos" acao={{ rotulo: 'Abrir', to: `${base}/nando` }}>
            {nando === null ? <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p> : !nandoRecentes.length ? <p className="py-2 text-sm text-[#6A6B70]">Nenhuma conversa ainda.</p> : (
              <ul className="divide-y divide-black/[0.06]">
                {nandoRecentes.map((c) => (
                  <li key={c.telefone}>
                    <Link to={`${base}/nando?tel=${encodeURIComponent(c.telefone)}`} className="flex items-center gap-3 py-2">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#17181A]/[0.06]"><Building2 className="h-4 w-4 text-[#45464A]" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2"><span className="truncate text-[14px] font-bold">{c.nome || c.telefone}</span>{c.aguardando > 0 && <span className="shrink-0 rounded-full bg-[#9C1E1E] px-1.5 text-[10.5px] font-bold text-white">{c.aguardando}</span>}<span className="ml-auto shrink-0 text-[12px] text-[#8A8B90]">{hora(c.ultima_em)}</span></span>
                        <span className="block truncate text-[12px] text-[#6A6B70]">{c.predio_atual || c.predios?.[0]?.nome || 'Sem prédio'} · {limpa(c.preview)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        </div>
      </div>

      {/* 5. CLIENTES NO AR */}
      <Bloco titulo={`Clientes no ar · ${ped.clientes.length}`} acao={{ rotulo: 'Todos os pedidos', to: `${base}/pedidos` }}>
        {!ped.clientes.length ? <p className="py-2 text-sm text-[#6A6B70]">Carregando pedidos…</p> : (
          <ul className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
            {ped.clientes.map((p) => {
              const a = atrasos?.get(p.id); const dr = diasRestantes(p); const vm = valorMensalDe(p);
              return (
                <li key={p.id} className="border-b border-black/[0.06]">
                  <Link to={`${base}/pedidos/${p.id}`} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#9C1E1E]/10 text-[12px] font-extrabold text-[#9C1E1E]">{titulo(p).trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{titulo(p)}</span>
                      <span className="block truncate text-[12px] text-[#6A6B70]">
                        {vm > 1 ? `${formatCurrency(vm)}/mês` : 'parceria'}{dr != null ? ` · ${dr <= 0 ? 'termina hoje' : `${dr} dias`}` : ''}
                      </span>
                    </span>
                    {a?.valor_atraso ? <span className="shrink-0 rounded-full bg-[#fdecec] px-2 py-0.5 text-[11px] font-bold text-[#b0261d]">{formatCurrency(a.valor_atraso)} · {a.dias_atraso} d</span>
                      : dr != null && dr <= 30 ? <span className="shrink-0 rounded-full bg-[#FFF4E5] px-2 py-0.5 text-[11px] font-bold text-[#9A5300]">renovar</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Bloco>

      {ped.aguardando.length > 0 && (
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#6A6B70]"><Users className="h-3.5 w-3.5" /> {ped.aguardando.length} pedido{ped.aguardando.length === 1 ? '' : 's'} pago{ped.aguardando.length === 1 ? '' : 's'} ou em contrato ainda sem vídeo no ar.</p>
      )}
    </div>
  );
}
