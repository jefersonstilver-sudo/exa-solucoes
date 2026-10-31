import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, MessageCircle, Tv, CheckSquare, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { FrotaPainel } from '@/modules/monitoramento-ia/hooks/useFrotaSaude';
import { useTelasDaRede } from '@/modules/monitoramento-ia/hooks/useTelasDaRede';
import { glass } from '@/modules/monitoramento-ia/components/paineis/estados';
import { SelosEstado } from '@/modules/monitoramento-ia/components/paineis/estadoVivo';
import { useAuth } from '@/hooks/useAuth';

/**
 * Dashboard no celular: o que importa agora, sem gráficos nem cartões arrastáveis.
 * Telas (mesma conta da página Painéis EXA: grupo Prédios, "no ar" = tocando), vídeos para aprovar,
 * últimos atendimentos da Sofia e do Nando. Atualiza a cada 60 s.
 */
type ConvSofia = { id: string; name: string; phone: string | null; mode: 'auto' | 'humano'; last_message_at: string | null; preview: string };
type ConvNando = { telefone: string; nome: string; predio_atual: string | null; predios: { nome: string }[]; modo: 'auto' | 'humano'; ultima_em: string; preview: string; aguardando: number };

const hora = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso), hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const ontem = new Date(hoje.getTime() - 86400000).toDateString() === d.toDateString();
  if (mesmoDia) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (ontem) return 'ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
const ehHoje = (iso?: string | null) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
const limpa = (t: string) => String(t || '').replace(/^\[ALERTA\]\s*/, '').replace(/\s+/g, ' ').trim();

const Secao: React.FC<{ titulo: string; acao?: { rotulo: string; to: string }; children: React.ReactNode }> = ({ titulo, acao, children }) => (
  <section className={`${glass} rounded-[22px] p-4`}>
    <div className="mb-2 flex items-center justify-between">
      <div role="heading" aria-level={2} className="text-[13px] font-extrabold uppercase tracking-[0.07em] text-[#6A6B70]">{titulo}</div>
      {acao && <Link to={acao.to} className="inline-flex h-8 items-center text-[13px] font-bold text-[#9C1E1E]">{acao.rotulo}</Link>}
    </div>
    {children}
  </section>
);

export default function DashboardCelular() {
  const { pathname } = useLocation();
  const base = pathname.startsWith('/admin') ? '/admin' : '/super_admin';
  const { userProfile } = useAuth();
  const telas = useTelasDaRede();
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

  // mesma conta da página Painéis EXA: só o grupo Prédios
  const daRede = telas.paineis;
  const noAr = telas.noAr;
  const ordemEstado: Record<string, number> = { sem_sinal: 0, sem_imagem: 1, internet_ruim: 2, instavel: 3, quente: 4 };
  const comProblema = daRede
    .filter((p) => p.estado in ordemEstado)
    .sort((a, b) => ordemEstado[a.estado] - ordemEstado[b.estado] || String(a.visto_anydesk_em).localeCompare(String(b.visto_anydesk_em)));
  const sofiaRecentes = (sofia || []).filter((c) => c.last_message_at).sort((a, b) => String(b.last_message_at).localeCompare(String(a.last_message_at))).slice(0, 5);
  const nandoRecentes = (nando || []).slice().sort((a, b) => String(b.ultima_em).localeCompare(String(a.ultima_em))).slice(0, 5);
  const atendHoje = (sofia || []).filter((c) => ehHoje(c.last_message_at)).length + (nando || []).filter((c) => ehHoje(c.ultima_em)).length;
  const nome = (userProfile as any)?.nome?.split(' ')[0] || (userProfile as any)?.name?.split(' ')[0] || '';
  const h = new Date().getHours();

  return (
    <div className="min-h-screen bg-[#F4F1EC] px-4 pb-28 pt-3 text-[#17181A]" style={{ fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <div className="mb-3">
        <div className="text-[13px] font-semibold text-[#6A6B70]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <div role="heading" aria-level={1} className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}{nome ? `, ${nome}` : ''}</div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { r: 'Telas no ar', v: telas.carregando ? '–' : `${noAr}/${daRede.length}`, c: comProblema.some((p) => p.estado === 'sem_sinal' || p.estado === 'sem_imagem') ? '#B0261D' : '#1E6B47', to: `${base}/paineis-exa`, I: Tv },
          { r: 'Para aprovar', v: aprovar ?? '–', c: aprovar ? '#9C1E1E' : '#1E6B47', to: `${base}/aprovacoes`, I: CheckSquare },
          { r: 'Conversas hoje', v: sofia && nando ? atendHoje : '–', c: '#17181A', to: `${base}/crm-evolution`, I: MessageCircle },
        ].map((k) => (
          <Link key={k.r} to={k.to} className={`${glass} rounded-[18px] px-3 py-3 active:scale-[.98]`}>
            <k.I className="h-4 w-4 text-[#6A6B70]" />
            <div className="mt-1.5 text-[22px] font-extrabold leading-none tracking-[-0.02em]" style={{ color: k.c }}>{k.v}</div>
            <div className="mt-1 text-[11.5px] font-bold leading-tight text-[#6A6B70]">{k.r}</div>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        <Secao titulo="Telas" acao={{ rotulo: 'Ver todas', to: `${base}/paineis-exa` }}>
          {telas.carregando ? (
            <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p>
          ) : !comProblema.length ? (
            <p className="py-1 text-[15px] font-bold text-[#1E6B47]">Todas as {daRede.length} telas no ar, sem alerta.</p>
          ) : (
            <ul className="divide-y divide-black/[0.06]">
              {comProblema.slice(0, 6).map((p: FrotaPainel) => (
                <li key={p.id}>
                  <Link to={`${base}/paineis-exa`} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold">{p.nome}</span>
                      <span className="block truncate text-[12px] text-[#6A6B70]">{p.operadora || 'Operadora ?'}{p.estado !== 'sem_sinal' ? ` · ${p.causa}` : ''}</span>
                    </span>
                    <SelosEstado estado={p.estado} desde={p.visto_anydesk_em} />
                  </Link>
                </li>
              ))}
              {comProblema.length > 6 && <li className="pt-2 text-[13px] font-semibold text-[#6A6B70]">+ {comProblema.length - 6} com alerta</li>}
            </ul>
          )}
        </Secao>

        <Secao titulo="Sofia · últimos atendimentos" acao={{ rotulo: 'Abrir', to: `${base}/crm-evolution/conversas/sofia` }}>
          {sofia === null ? <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p> : !sofiaRecentes.length ? <p className="py-2 text-sm text-[#6A6B70]">Nenhuma conversa ainda.</p> : (
            <ul className="divide-y divide-black/[0.06]">
              {sofiaRecentes.map((c) => (
                <li key={c.id}>
                  <Link to={`${base}/crm-evolution/conversas/sofia${c.phone ? `?telefone=${encodeURIComponent(c.phone)}` : ''}`} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#9C1E1E]/10 text-[13px] font-extrabold text-[#9C1E1E]">{(c.name || '?').trim().charAt(0).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-bold">{c.name || c.phone || 'Sem nome'}</span>
                        {c.mode === 'humano' && <span className="shrink-0 rounded-full bg-[#EEF2FB] px-2 py-0.5 text-[10.5px] font-bold text-[#2B4C8C]">Você</span>}
                        <span className="ml-auto shrink-0 text-[12px] text-[#8A8B90]">{hora(c.last_message_at)}</span>
                      </span>
                      <span className="line-clamp-2 text-[13px] leading-snug text-[#5E5F63]">{limpa(c.preview)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Nando · últimos atendimentos" acao={{ rotulo: 'Abrir', to: `${base}/nando` }}>
          {nando === null ? <p className="py-2 text-sm text-[#6A6B70]">Carregando…</p> : !nandoRecentes.length ? <p className="py-2 text-sm text-[#6A6B70]">Nenhuma conversa ainda.</p> : (
            <ul className="divide-y divide-black/[0.06]">
              {nandoRecentes.map((c) => (
                <li key={c.telefone}>
                  <Link to={`${base}/nando?tel=${encodeURIComponent(c.telefone)}`} className="flex items-start gap-3 py-2.5">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#17181A]/[0.06]"><Building2 className="h-4 w-4 text-[#45464A]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-bold">{c.nome || c.telefone}</span>
                        {c.aguardando > 0 && <span className="shrink-0 rounded-full bg-[#9C1E1E] px-1.5 text-[10.5px] font-bold text-white">{c.aguardando}</span>}
                        <span className="ml-auto shrink-0 text-[12px] text-[#8A8B90]">{hora(c.ultima_em)}</span>
                      </span>
                      <span className="block truncate text-[12px] font-semibold text-[#6A6B70]">{c.predio_atual || c.predios?.[0]?.nome || 'Sem prédio'}</span>
                      <span className="line-clamp-2 text-[13px] leading-snug text-[#5E5F63]">{limpa(c.preview)}</span>
                    </span>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[#C9C1C3]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
}
