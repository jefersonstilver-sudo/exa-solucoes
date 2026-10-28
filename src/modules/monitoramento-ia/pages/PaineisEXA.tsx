/**
 * Painéis EXA — página nova (layout aprovado em 28/10/2026).
 * Entrada em formato dashboard: quantas telas tocam, quem está fora e por quê, operadoras e a análise do
 * Técnico EXA (recolhida). Abaixo, todos os painéis por grupo; clicar no card mostra o porquê e as ações;
 * "Abrir painel" abre o detalhe com TODAS as opções de antes (grupo, prédio, elevador, alertas, incidentes, abas).
 * "Conexões" mostra todas as conexões por operadora com ranking de quedas.
 */
import { useEffect, useMemo, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Activity, ChevronDown, MoreHorizontal, Clock, Copy, Layers, Link2, MapPin, Maximize2, RefreshCw, Search, Sparkles, ExternalLink, BellOff,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generatePublicUrl } from '@/config/domain';
import { useDevices } from '../hooks/useDevices';
import { useFrotaSaude, type FrotaPainel, type EstadoPainel } from '../hooks/useFrotaSaude';
import { usePeriodDeviceEvents } from '../hooks/usePeriodDeviceEvents';
import { useDeviceIncidentStatus } from '../hooks/useDeviceIncidentStatus';
import { usePendingIncidents } from '../hooks/useDeviceIncidents';
import { useOfflineAlerts } from '../hooks/useOfflineAlerts';
import { useDeviceGroups } from '@/hooks/useDeviceGroups';
import type { Device } from '../utils/devices';
import { ComputerDetailModal } from '../components/anydesk/ComputerDetailModal';
import { PanelsListView } from '../components/PanelsListView';
import { FullscreenMonitor } from '../components/FullscreenMonitor';
import { OfflineAlert } from '../components/OfflineAlert';
import { PeriodSelector, type PeriodType } from '../components/PeriodSelector';
import { PaineisMapModal } from '../components/paineis/PaineisMapModal';
import { SyncHealthDialog } from '../components/SyncHealthDialog';
import { ConfigHorarioDialog } from '@/components/admin/paineis-exa/ConfigHorarioDialog';
import { DeviceGroupManager } from '@/components/monitor/DeviceGroupManager';
import { InternetAccountsSection } from '@/components/admin/internet-accounts/InternetAccountsSection';
import { ESTADO_INFO, ehProblema, glass } from '../components/paineis/estados';

const periodoRotulo: Record<PeriodType, string> = {
  hoje: 'hoje', ontem: 'ontem', 'esta-semana': 'esta semana', '7dias': 'últ. 7 dias', '30dias': 'últ. 30 dias', personalizado: 'no período',
};
const hhmm = (d?: Date | null) => d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
const ehGrupoPredios = (nome?: string | null) => /^pr[eé]dios$/i.test((nome || '').trim());

type Visao = 'paineis' | 'conexoes';
type FiltroEstado = 'todos' | 'problema' | EstadoPainel;
type Ordem = 'quedas' | 'nome' | 'estado';

const Chip = ({ children, fundo = 'rgba(23,24,26,0.05)', cor = '#45464A' }: { children: React.ReactNode; fundo?: string; cor?: string }) => (
  <span className="inline-flex h-6 max-w-full items-center gap-1.5 truncate rounded-full px-2.5 text-[11px] font-bold" style={{ background: fundo, color: cor }}>{children}</span>
);


export default function PaineisEXA() {
  const { devices, refresh, lastUpdate } = useDevices(0, 500);
  const frota = useFrotaSaude();
  const { groups: deviceGroups, createGroup, updateGroup, deleteGroup, moveDeviceToGroup } = useDeviceGroups();

  const [periodo, setPeriodo] = useState<PeriodType>('hoje');
  const [ini, setIni] = useState<Date | undefined>();
  const [fim, setFim] = useState<Date | undefined>();
  const { eventsMap, offlineTimeMap } = usePeriodDeviceEvents(periodo, ini, fim);
  const { incidentStatusMap, refetch: refetchIncidentes } = useDeviceIncidentStatus(devices);
  const offlineIds = useMemo(() => devices.filter((d) => d.status === 'offline').map((d) => d.id), [devices]);
  const pendentes = usePendingIncidents(offlineIds);
  const { offlineDevices, activeAlerts, dismissAlert } = useOfflineAlerts();

  const [visao, setVisao] = useState<Visao>('paineis');
  const [busca, setBusca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroOp, setFiltroOp] = useState<string>('todas');
  const [filtroElev, setFiltroElev] = useState<string>('todas');
  const [ordem, setOrdem] = useState<Ordem>('estado');
  const [modo, setModo] = useState<'cards' | 'tabela'>('cards');
  const [iaAberta, setIaAberta] = useState(false);
  const [cardAberto, setCardAberto] = useState<string | null>(null);
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());
  const [selecionado, setSelecionado] = useState<Device | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const [mapa, setMapa] = useState(false);
  const [gruposDlg, setGruposDlg] = useState(false);
  const [horarioDlg, setHorarioDlg] = useState(false);
  const [syncDlg, setSyncDlg] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [predios, setPredios] = useState<Map<string, string>>(new Map());
  const [elevadores, setElevadores] = useState<Map<string, string>>(new Map());

  // nomes de prédios e empresas de elevador para os chips
  useEffect(() => {
    (supabase as any).from('buildings').select('id, nome').then(({ data }: any) => setPredios(new Map((data || []).map((b: any) => [b.id, b.nome]))));
    (supabase as any).from('fornecedores').select('id, nome_fantasia').then(({ data }: any) => setElevadores(new Map((data || []).map((f: any) => [f.id, f.nome_fantasia]))));
  }, []);

  // AnyDesk em segundo plano a cada 2 min (como antes)
  useEffect(() => {
    const t = setInterval(() => { supabase.functions.invoke('sync-anydesk', { body: {} }).catch(() => {}); }, 120000);
    return () => clearInterval(t);
  }, []);

  const devPorId = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);
  const grupoPorId = useMemo(() => new Map(deviceGroups.map((g) => [g.id, g])), [deviceGroups]);

  // estado ao vivo: status do AnyDesk vem do devices (15 s); diagnóstico vem da frota (60 s)
  const paineis: FrotaPainel[] = useMemo(() => frota.paineis.map((p) => {
    const d = devPorId.get(p.id);
    if (!d) return p;
    const caiuAgora = d.status === 'offline' && p.status_anydesk !== 'offline' && !p.coletor?.vivo;
    return {
      ...p,
      status_anydesk: d.status,
      grupo_id: (d as any).device_group_id ?? p.grupo_id,
      estado: caiuAgora ? 'sem_sinal' : p.estado,
      causa: caiuAgora ? 'Acabou de cair no AnyDesk; aguardando o próximo diagnóstico.' : p.causa,
    };
  }), [frota.paineis, devPorId]);

  const operadoras = useMemo(() => [...new Set(paineis.map((p) => p.operadora || 'Sem operadora'))].sort(), [paineis]);
  const elevOpcoes = useMemo(() => {
    const ids = [...new Set(devices.map((d) => d.empresa_elevador_id).filter(Boolean))] as string[];
    return ids.map((id) => ({ id, nome: elevadores.get(id) || 'Empresa' })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [devices, elevadores]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const r = paineis.filter((p) => {
      if (filtroEstado === 'problema' && !ehProblema(p.estado)) return false;
      if (filtroEstado !== 'todos' && filtroEstado !== 'problema' && p.estado !== filtroEstado) return false;
      if (filtroOp !== 'todas' && (p.operadora || 'Sem operadora') !== filtroOp) return false;
      if (filtroElev !== 'todas' && devPorId.get(p.id)?.empresa_elevador_id !== filtroElev) return false;
      if (!q) return true;
      return [p.nome, p.condominio, p.endereco, p.anydesk, p.operadora, p.building_id ? predios.get(p.building_id) : ''].some((x) => (x || '').toLowerCase().includes(q));
    });
    const peso: Record<EstadoPainel, number> = { sem_sinal: 0, sem_imagem: 1, internet_ruim: 2, quente: 3, instavel: 4, sem_diagnostico: 5, tocando: 6 };
    return r.sort((a, b) => ordem === 'nome' ? a.nome.localeCompare(b.nome)
      : ordem === 'quedas' ? b.quedas_7d - a.quedas_7d
      : peso[a.estado] - peso[b.estado] || b.quedas_7d - a.quedas_7d);
  }, [paineis, busca, filtroEstado, filtroOp, filtroElev, ordem, devPorId, predios]);

  const grupos = useMemo(() => {
    const m = new Map<string, FrotaPainel[]>();
    for (const p of filtrados) { const k = p.grupo_id || '__sem__'; if (!m.has(k)) m.set(k, []); m.get(k)!.push(p); }
    const out = deviceGroups.filter((g) => m.has(g.id)).map((g) => ({ id: g.id, nome: g.nome, cor: g.cor, silenciado: g.silenciar_alertas, itens: m.get(g.id)! }));
    if (m.has('__sem__')) out.push({ id: '__sem__', nome: 'Sem grupo', cor: '#9A9893', silenciado: false, itens: m.get('__sem__')! });
    return out;
  }, [filtrados, deviceGroups]);

  // conexões e operadoras: só os painéis do grupo Prédios (regra do sistema)
  const idsPredios = useMemo(() => {
    const g = deviceGroups.find((x) => ehGrupoPredios(x.nome));
    return g ? new Set(paineis.filter((p) => p.grupo_id === g.id).map((p) => p.id)) : null;
  }, [deviceGroups, paineis]);
  const daRede = useMemo(() => paineis.filter((p) => !idsPredios || idsPredios.has(p.id)), [paineis, idsPredios]);

  const porOperadora = useMemo(() => {
    const m = new Map<string, { nome: string; total: number; fora: number; ruins: number; quedas: number }>();
    for (const p of daRede) {
      const k = p.operadora || 'Sem operadora';
      const o = m.get(k) || { nome: k, total: 0, fora: 0, ruins: 0, quedas: 0 };
      o.total++; o.quedas += p.quedas_7d;
      if (p.estado === 'sem_sinal') o.fora++;
      else if (['internet_ruim', 'instavel'].includes(p.estado)) o.ruins++;
      m.set(k, o);
    }
    return [...m.values()].sort((a, b) => (b.fora + b.ruins) / b.total - (a.fora + a.ruins) / a.total || b.total - a.total);
  }, [daRede]);

  const kpis = useMemo(() => {
    const c = (f: (p: FrotaPainel) => boolean) => daRede.filter(f).length;
    return {
      total: daRede.length,
      tocando: c((p) => p.estado !== 'sem_sinal' && p.estado !== 'sem_imagem'),
      semSinal: c((p) => p.estado === 'sem_sinal'),
      semImagem: c((p) => p.estado === 'sem_imagem'),
      internet: c((p) => p.estado === 'internet_ruim' || p.estado === 'instavel'),
      quentes: c((p) => p.estado === 'quente' || (p.temp_c ?? 0) >= 85),
      semColetor: c((p) => !p.coletor),
      quedas24: daRede.reduce((a, p) => a + p.quedas_24h, 0),
    };
  }, [daRede]);

  const fora = useMemo(() => daRede.filter((p) => p.estado === 'sem_sinal' || p.estado === 'sem_imagem'), [daRede]);

  const abrir = (id: string) => { const d = devPorId.get(id); if (d) setSelecionado(d); else toast.error('Painel ainda carregando, tente de novo.'); };
  const copiar = async (p: FrotaPainel) => {
    const elev = devPorId.get(p.id)?.empresa_elevador_id;
    const t = [
      `Painel: ${p.nome}`, p.building_id && predios.get(p.building_id) ? `Prédio: ${predios.get(p.building_id)}` : null,
      p.endereco ? `Endereço: ${p.endereco}` : null, `Operadora: ${p.operadora || 'não informada'}`,
      p.anydesk ? `AnyDesk: ${p.anydesk}` : null, elev ? `Empresa do elevador: ${elevadores.get(elev) || ''}` : null,
      `Situação: ${ESTADO_INFO[p.estado].rotulo} — ${p.causa}`, `Quedas em 7 dias: ${p.quedas_7d} (fora ${p.fora_7d})`,
    ].filter(Boolean).join('\n');
    try { await navigator.clipboard.writeText(t); toast.success('Informações copiadas'); } catch { toast.error('Não consegui copiar'); }
  };
  const sincronizar = async () => {
    setSincronizando(true);
    const { error } = await supabase.functions.invoke('sync-anydesk', { body: { force: true } });
    setSincronizando(false);
    if (error) toast.error('Erro ao sincronizar com o AnyDesk'); else { toast.success('AnyDesk sincronizado'); refresh(); frota.recarregar(); }
  };
  const alternarGrupo = (id: string) => setGruposFechados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const manchete = (() => {
    const partes: string[] = [];
    if (kpis.semSinal) partes.push(`${kpis.semSinal} sem sinal`);
    const pior = porOperadora.find((o) => o.total >= 3 && (o.fora + o.ruins) / o.total >= 0.3);
    if (pior) partes.push(`${pior.nome} com problema em ${pior.fora + pior.ruins} de ${pior.total} prédios`);
    if (kpis.quentes) partes.push(`${kpis.quentes} NUC${kpis.quentes > 1 ? 's' : ''} quente${kpis.quentes > 1 ? 's' : ''}`);
    if (kpis.semColetor) partes.push(`${kpis.semColetor} sem diagnóstico`);
    return partes.join(' · ') || 'Tudo tocando normalmente';
  })();

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 text-[#17181A] md:space-y-6" style={{ fontFeatureSettings: '"tnum"' }}>
      {/* Cabeçalho: título, ao vivo, abas e só 2 ações (as outras ficam em "Mais") */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[30px]">Painéis EXA</h1>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E6B47]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2E9B62]" />ao vivo {hhmm(frota.geradoEm || lastUpdate).slice(0, 5)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-black/[0.05] p-1" role="tablist" aria-label="Visão">
            {(['paineis', 'conexoes'] as Visao[]).map((v) => (
              <button key={v} role="tab" aria-selected={visao === v} type="button" onClick={() => setVisao(v)}
                className={`h-8 rounded-lg px-3 text-sm font-bold transition-colors ${visao === v ? 'bg-white shadow-sm' : 'text-[#5E5F63] hover:text-[#17181A]'}`}>
                {v === 'paineis' ? 'Visão geral' : 'Conexões'}
              </button>
            ))}
          </div>
          <button type="button" onClick={sincronizar} title="Buscar agora o status no AnyDesk"
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold ${glass} hover:bg-white`}>
            <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Atualizar</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Mais ações" className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold ${glass} hover:bg-white`}>
                <MoreHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Mais</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => setMapa(true)}><MapPin className="mr-2 h-4 w-4" />Ver mapa dos painéis</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGruposDlg(true)}><Layers className="mr-2 h-4 w-4" />Gerenciar grupos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHorarioDlg(true)}><Clock className="mr-2 h-4 w-4" />Horário de funcionamento</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTelaCheia(true)}><Maximize2 className="mr-2 h-4 w-4" />Monitor em tela cheia</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSyncDlg(true)}><Activity className="mr-2 h-4 w-4" />Saúde da conexão com o AnyDesk</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { const u = generatePublicUrl('/monitor'); navigator.clipboard.writeText(u); toast.success('Link copiado', { description: u }); }}><Link2 className="mr-2 h-4 w-4" />Copiar link do monitor público</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {frota.erro && !frota.paineis.length && (
        <div className={`${glass} rounded-2xl p-4 text-sm text-[#B0261D]`}>Não consegui carregar o diagnóstico dos painéis ({frota.erro}). A lista abaixo usa só o AnyDesk.</div>
      )}

      {visao === 'paineis' ? (
        <>
          {/* Resumo em uma faixa: online (verde) + o que precisa de atenção */}
          <section aria-label="Resumo" className={`${glass} grid gap-4 rounded-[22px] p-4 md:grid-cols-[1.3fr_2fr] md:items-center md:p-5`}>
            <button type="button" onClick={() => setFiltroEstado('todos')} className="text-left">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#1E6B47]">Online agora</span>
              <span className="mt-1 flex items-baseline gap-2">
                <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-[#1E6B47]">{frota.carregando ? '–' : kpis.tocando}</span>
                <span className="text-base font-bold text-[#8A8B90]">de {kpis.total} telas</span>
              </span>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <span className="block h-full rounded-full bg-[#2E9B62] transition-all" style={{ width: kpis.total ? `${(kpis.tocando / kpis.total) * 100}%` : '0%' }} />
              </span>
            </button>
            <div className="grid grid-cols-3 gap-2">
              {[
                { r: 'Sem sinal', v: kpis.semSinal + kpis.semImagem, c: '#B0261D', f: 'sem_sinal' as FiltroEstado },
                { r: 'Com problema', v: kpis.internet + kpis.quentes, c: '#9A5300', f: 'problema' as FiltroEstado },
                { r: 'Quedas 24 h', v: kpis.quedas24, c: '#45464A', f: 'instavel' as FiltroEstado },
              ].map((k) => (
                <button key={k.r} type="button" onClick={() => { setFiltroEstado(k.f); document.getElementById('lista-paineis')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="rounded-2xl bg-white/70 px-3 py-2.5 text-left transition-colors hover:bg-white">
                  <span className="block text-[11px] font-bold text-[#6A6B70]">{k.r}</span>
                  <span className="block text-[26px] font-extrabold leading-tight" style={{ color: k.v ? k.c : '#1E6B47' }}>{frota.carregando ? '–' : k.v}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Atenção agora: a análise do Técnico EXA e quem está fora ficam no MESMO quadro */}
          <section className={`${glass} rounded-[22px] p-4 md:p-5`} aria-labelledby="t-atencao">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E7] text-[#B0261D]"><Sparkles className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <h2 id="t-atencao" className="text-[15px] font-extrabold">Técnico EXA · o que precisa de atenção</h2>
                <p className="text-sm text-[#45464A]">{manchete}</p>
                <button type="button" onClick={() => { const n = !iaAberta; setIaAberta(n); if (n && !frota.tecnico && !frota.analisando) frota.analisar(); }}
                  aria-expanded={iaAberta} className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#9C1E1E]">
                  {iaAberta ? 'Fechar análise' : 'Ver análise completa'}<ChevronDown className={`h-4 w-4 transition-transform ${iaAberta ? 'rotate-180' : ''}`} />
                </button>
                {iaAberta && (
                  <div className="mt-2 rounded-2xl bg-white/70 p-3">
                    {frota.analisando ? (
                      <p className="text-sm text-[#5E5F63]">Analisando histórico, diário de conexão e leituras dos NUCs…</p>
                    ) : (
                      <div className="whitespace-pre-line text-sm leading-relaxed text-[#2A2B2E]">{frota.tecnico}</div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6A6B70]">
                      <span>Escrita pela IA só com os dados medidos; confira antes de mandar alguém ao prédio.</span>
                      <button type="button" onClick={frota.analisar} disabled={frota.analisando} className="font-bold text-[#9C1E1E] disabled:opacity-50">Analisar de novo</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {fora.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-[#EAF5EF] px-3 py-2.5 text-sm font-semibold text-[#1E6B47]">Todas as telas dos prédios estão online.</p>
            ) : (
              <ul className="mt-4 grid gap-2 lg:grid-cols-2">
                {fora.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-[#F3C9C4] bg-[#FDF3F2] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <button type="button" onClick={() => abrir(p.id)} className="text-left text-[15px] font-extrabold text-[#8E1F17] hover:underline">{p.nome}</button>
                      <span className="text-xs text-[#6A6B70]">{p.operadora || 'operadora ?'} · {p.endereco || 'sem endereço'}</span>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-[#3F4044]">{p.causa}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => copiar(p)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-semibold"><Copy className="h-3.5 w-3.5" />Copiar</button>
                      {p.anydesk && <a href={`anydesk:${String(p.anydesk).replace(/\D/g, '')}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-semibold"><ExternalLink className="h-3.5 w-3.5" />AnyDesk</a>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Busca e filtros */}
          <section id="lista-paineis" aria-label="Buscar e filtrar" className={`${glass} flex flex-col gap-2 rounded-[18px] p-3 md:flex-row md:flex-wrap md:items-center`}>
            <label className="relative flex-1 md:min-w-[260px]">
              <span className="sr-only">Buscar</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6A6B70]" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar prédio, endereço ou ID AnyDesk"
                className="h-10 w-full rounded-xl border border-black/10 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B4231C]" />
            </label>
            <div className="grid grid-cols-2 gap-2 md:flex">
              <select aria-label="Situação" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                <option value="todos">Situação: todas</option>
                <option value="problema">Com problema</option>
                {(Object.keys(ESTADO_INFO) as EstadoPainel[]).map((e) => <option key={e} value={e}>{ESTADO_INFO[e].rotulo}</option>)}
              </select>
              <select aria-label="Operadora" value={filtroOp} onChange={(e) => setFiltroOp(e.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                <option value="todas">Operadora: todas</option>
                {operadoras.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <select aria-label="Empresa de elevador" value={filtroElev} onChange={(e) => setFiltroElev(e.target.value)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                <option value="todas">Elevador: todas</option>
                {elevOpcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
              <select aria-label="Ordenar" value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold">
                <option value="estado">Ordenar: problemas primeiro</option>
                <option value="quedas">Ordenar: mais quedas</option>
                <option value="nome">Ordenar: nome</option>
              </select>
            </div>
            <PeriodSelector value={periodo} onChange={(p, a, b) => { setPeriodo(p); if (a) setIni(a); if (b) setFim(b); }} customStartDate={ini} customEndDate={fim} />
            <div className="inline-flex self-start rounded-xl bg-black/[0.05] p-1 md:ml-auto">
              {(['cards', 'tabela'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setModo(m)} aria-pressed={modo === m}
                  className={`h-8 rounded-lg px-3 text-sm font-bold ${modo === m ? 'bg-white shadow-sm' : 'text-[#5E5F63]'}`}>{m === 'cards' ? 'Cards' : 'Tabela'}</button>
              ))}
            </div>
          </section>

          {modo === 'tabela' ? (
            <div className={`${glass} overflow-hidden rounded-[18px] p-2`}>
              <PanelsListView
                devices={filtrados.map((p) => devPorId.get(p.id)).filter(Boolean) as Device[]}
                sort={{ field: 'offline_count', order: 'desc' }}
                onSortChange={() => {}}
                onDeviceClick={(d) => setSelecionado(d)}
                periodEventsMap={eventsMap}
                offlineTimeMap={offlineTimeMap}
                periodLabel={periodoRotulo[periodo]}
              />
            </div>
          ) : (
            <div className="space-y-5">
              {frota.carregando && !paineis.length && <p className="text-sm text-[#6A6B70]">Carregando painéis…</p>}
              {!frota.carregando && !filtrados.length && <p className={`${glass} rounded-2xl p-6 text-sm text-[#6A6B70]`}>Nenhum painel com esses filtros.</p>}
              {grupos.map((g) => {
                const fechado = gruposFechados.has(g.id);
                const problemas = g.itens.filter((p) => ehProblema(p.estado)).length;
                return (
                  <section key={g.id}>
                    <button type="button" onClick={() => alternarGrupo(g.id)} aria-expanded={!fechado}
                      className="mb-3 flex w-full items-center gap-2 text-left">
                      <span className="h-3 w-3 rounded-full" style={{ background: g.cor || '#9A9893' }} />
                      <strong className="text-base">{g.nome}</strong>
                      <span className="text-sm text-[#6A6B70]">({g.itens.length})</span>
                      {problemas > 0 && <Chip fundo="#FCF1DF" cor="#9A5300">{problemas} com problema</Chip>}
                      {g.silenciado && <Chip><BellOff className="h-3 w-3" />sem notificações</Chip>}
                      <ChevronDown className={`ml-auto h-4 w-4 text-[#6A6B70] transition-transform ${fechado ? '-rotate-90' : ''}`} />
                    </button>
                    {!fechado && (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {g.itens.map((p) => {
                          const info = ESTADO_INFO[p.estado];
                          const dev = devPorId.get(p.id);
                          const aberto = cardAberto === p.id;
                          const elev = dev?.empresa_elevador_id ? elevadores.get(dev.empresa_elevador_id) : null;
                          const predio = p.building_id ? predios.get(p.building_id) : null;
                          const inc = incidentStatusMap.get(p.id);
                          return (
                            <div key={p.id} className="overflow-hidden rounded-[20px] border shadow-[0_10px_24px_-22px_rgba(70,20,20,0.35)]" style={{ background: info.cardFundo, borderColor: info.cardBorda }}>
                              <button type="button" onClick={() => setCardAberto(aberto ? null : p.id)} aria-expanded={aberto}
                                className="flex w-full flex-col gap-2 p-4 text-left">
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-[15px] font-extrabold leading-tight">{p.nome}</span>
                                  <Chip fundo={info.fundo} cor={info.cor}><span className="h-1.5 w-1.5 rounded-full" style={{ background: info.ponto }} />{info.rotulo}</Chip>
                                </span>
                                <span className="flex min-w-0 items-center gap-2 text-xs text-[#6A6B70]">
                                  <Chip>{p.operadora || 'Operadora ?'}</Chip>
                                  <span className="truncate">{p.endereco || 'Endereço não cadastrado'}</span>
                                </span>
                                <span className="flex flex-wrap gap-1.5">
                                  <Chip fundo={p.quedas_7d >= 15 ? '#FCF1DF' : undefined} cor={p.quedas_7d >= 15 ? '#9A5300' : undefined}>{p.quedas_7d} quedas · 7d</Chip>
                                  {(eventsMap.get(p.id) || 0) > 0 && periodo !== '7dias' && <Chip>{eventsMap.get(p.id)} {periodoRotulo[periodo]}</Chip>}
                                  <Chip>{predio ? `Prédio: ${predio}` : 'Sem prédio'}</Chip>
                                  {elev && <Chip>Elevador: {elev}</Chip>}
                                  {(p.causa_registrada || inc) && <Chip fundo="#EEF2FB" cor="#2B4C8C">{p.causa_registrada ? 'Causa registrada' : 'Causa pendente'}</Chip>}
                                </span>
                                <span className="text-sm leading-snug text-[#3F4044]"><strong>Causa:</strong> {p.causa}</span>
                                <span className="flex justify-between text-[11px] text-[#8A8B90]">
                                  <span>ID {p.anydesk || '—'}</span>
                                  <span>{p.player?.versao || (p.coletor ? 'diagnóstico ativo' : 'sem coletor')}</span>
                                </span>
                              </button>
                              {aberto && (
                                <div className="border-t border-black/[0.06] bg-white/60 p-4">
                                  <p className="text-sm leading-relaxed text-[#2A2B2E]">
                                    <strong className="block text-[#9C1E1E]">Por que (Técnico EXA)</strong>
                                    {p.porque_cai ? `Nas últimas 24 h ${p.porque_cai}. ` : ''}
                                    {p.perda_internet_pct != null ? `Perda agora: internet ${p.perda_internet_pct}%, roteador ${p.perda_roteador_pct ?? '?'}%. ` : ''}
                                    {p.temp_c != null ? `${p.temp_c} °C. ` : ''}
                                    {p.ultimo_boot?.tipo ? `Último religamento: ${p.ultimo_boot.tipo}. ` : ''}
                                    {`Fora ${p.fora_7d} em 7 dias.`}
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => abrir(p.id)} className="inline-flex h-9 items-center rounded-xl bg-[#17181A] px-3 text-sm font-bold text-white">Abrir painel</button>
                                    <button type="button" onClick={() => copiar(p)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold"><Copy className="h-4 w-4" />Copiar informações</button>
                                    {p.anydesk && <a href={`anydesk:${String(p.anydesk).replace(/\D/g, '')}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-sm font-semibold"><ExternalLink className="h-4 w-4" />AnyDesk</a>}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {import.meta.env.VITE_ENABLE_INTERNET_ACCOUNTS !== 'false' && (
            <details className={`${glass} rounded-[22px] p-4 md:p-5`}>
              <summary className="cursor-pointer text-base font-extrabold">Contas de internet e conciliação <span className="text-sm font-medium text-[#6A6B70]">· faturas, contratos e exceções</span></summary>
              <div className="mt-4"><InternetAccountsSection /></div>
            </details>
          )}
        </>
      ) : (
        <Conexoes
          paineis={daRede}
          porOperadora={porOperadora}
          filtroOp={filtroOp}
          setFiltroOp={setFiltroOp}
          abrir={abrir}
          predios={predios}
          semGrupoPredios={!idsPredios}
        />
      )}

      {selecionado && (
        <ComputerDetailModal
          computer={selecionado}
          isOpen={!!selecionado}
          onClose={() => { setSelecionado(null); refetchIncidentes(); }}
          onDeleted={() => { refresh(); frota.recarregar(); }}
          onIncidentUpdate={() => { refetchIncidentes(); frota.recarregar(); }}
          onGroupChanged={() => refresh()}
          theme="light"
          periodEventsCount={eventsMap.get(selecionado.id) || 0}
          periodOfflineCount={eventsMap.get(selecionado.id) || 0}
          periodLabel={periodoRotulo[periodo]}
          deviceGroups={deviceGroups}
          moveDeviceToGroup={moveDeviceToGroup}
          saude={paineis.find((p) => p.id === selecionado.id) || null}
        />
      )}

      {telaCheia && <FullscreenMonitor devices={devices} onClose={() => setTelaCheia(false)} incidentStatusMap={incidentStatusMap} incidentDataMap={pendentes} />}

      <div className="fixed right-4 top-20 z-50 max-w-md space-y-3 md:right-6">
        <AnimatePresence mode="popLayout">
          {offlineDevices.filter((d) => activeAlerts.includes(d.id)).slice(0, 3).map((d) => (
            <OfflineAlert key={d.id} panelName={d.name} onClose={() => dismissAlert(d.id)} />
          ))}
        </AnimatePresence>
      </div>

      <ConfigHorarioDialog open={horarioDlg} onOpenChange={setHorarioDlg} paineis={devices} />
      <DeviceGroupManager open={gruposDlg} onOpenChange={setGruposDlg} groups={deviceGroups} onCreateGroup={createGroup} onUpdateGroup={updateGroup} onDeleteGroup={deleteGroup} />
      <AnimatePresence>
        {mapa && <PaineisMapModal isOpen={mapa} onClose={() => setMapa(false)} eventsMap={eventsMap} periodLabel={periodoRotulo[periodo]} />}
      </AnimatePresence>
      <SyncHealthDialog open={syncDlg} onOpenChange={setSyncDlg} />
    </div>
  );
}

/** Todas as conexões (painéis do grupo Prédios): por operadora, situação e ranking de quedas em 7 dias. */
function Conexoes({ paineis, porOperadora, filtroOp, setFiltroOp, abrir, predios, semGrupoPredios }: {
  paineis: FrotaPainel[];
  porOperadora: { nome: string; total: number; fora: number; ruins: number; quedas: number }[];
  filtroOp: string;
  setFiltroOp: (v: string) => void;
  abrir: (id: string) => void;
  predios: Map<string, string>;
  semGrupoPredios: boolean;
}) {
  const [situacao, setSituacao] = useState<'todas' | 'desconectados' | 'instaveis' | 'ok'>('todas');
  const lista = useMemo(() => paineis
    .filter((p) => filtroOp === 'todas' || (p.operadora || 'Sem operadora') === filtroOp)
    .filter((p) => situacao === 'todas' ? true
      : situacao === 'desconectados' ? p.estado === 'sem_sinal'
      : situacao === 'instaveis' ? ['internet_ruim', 'instavel'].includes(p.estado) || p.quedas_7d >= 15
      : !ehProblema(p.estado))
    .sort((a, b) => b.quedas_7d - a.quedas_7d || b.fora_7d_min - a.fora_7d_min), [paineis, filtroOp, situacao]);

  return (
    <div className="space-y-5">
      {semGrupoPredios && <p className="text-xs text-[#6A6B70]">Grupo “Prédios” não encontrado: mostrando todos os painéis.</p>}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <button type="button" onClick={() => setFiltroOp('todas')} aria-pressed={filtroOp === 'todas'}
          className={`${glass} rounded-[20px] p-4 text-left ${filtroOp === 'todas' ? 'ring-2 ring-[#9C1E1E]' : ''}`}>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">Todas</span>
          <span className="block text-[30px] font-extrabold leading-tight">{paineis.length}</span>
          <span className="text-xs text-[#6A6B70]">conexões</span>
        </button>
        {porOperadora.map((o) => (
          <button key={o.nome} type="button" onClick={() => setFiltroOp(filtroOp === o.nome ? 'todas' : o.nome)} aria-pressed={filtroOp === o.nome}
            className={`${glass} rounded-[20px] p-4 text-left ${filtroOp === o.nome ? 'ring-2 ring-[#9C1E1E]' : ''}`}>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">{o.nome}</span>
            <span className="block text-[30px] font-extrabold leading-tight">{o.total}</span>
            <span className="text-xs"><span className="font-bold text-[#B0261D]">{o.fora} fora</span> · <span className="font-bold text-[#9A5300]">{o.ruins} ruins</span> · {o.quedas} quedas</span>
          </button>
        ))}
      </section>

      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-black/[0.05] p-1">
        {([['todas', 'Todas'], ['desconectados', 'Desconectados'], ['instaveis', 'Instáveis'], ['ok', 'Funcionando']] as const).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setSituacao(v)} aria-pressed={situacao === v}
            className={`h-8 rounded-lg px-3 text-sm font-bold ${situacao === v ? 'bg-white shadow-sm' : 'text-[#5E5F63]'}`}>{l}</button>
        ))}
      </div>

      <div className={`${glass} overflow-x-auto rounded-[20px]`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#6A6B70]">
              <th className="px-4 py-3">#</th><th className="px-2 py-3">Prédio</th><th className="px-2 py-3">Operadora</th><th className="px-2 py-3">Agora</th>
              <th className="px-2 py-3 text-right">Quedas 7d</th><th className="px-2 py-3 text-right">Fora 7d</th><th className="px-2 py-3">Causa provável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.06]">
            {lista.map((p, i) => {
              const info = ESTADO_INFO[p.estado];
              return (
                <tr key={p.id} className="cursor-pointer hover:bg-white/70" onClick={() => abrir(p.id)}>
                  <td className="px-4 py-3 text-[#8A8B90]">{i + 1}</td>
                  <td className="px-2 py-3"><strong>{p.nome}</strong><span className="block text-xs text-[#6A6B70]">{(p.building_id && predios.get(p.building_id)) || p.endereco || ''}</span></td>
                  <td className="px-2 py-3">{p.operadora || '—'}</td>
                  <td className="px-2 py-3"><Chip fundo={info.fundo} cor={info.cor}>{info.rotulo}</Chip></td>
                  <td className="px-2 py-3 text-right font-bold">{p.quedas_7d}</td>
                  <td className="px-2 py-3 text-right">{p.fora_7d}</td>
                  <td className="max-w-[420px] px-2 py-3 text-[#3F4044]">{p.porque_cai ? `${p.porque_cai[0].toUpperCase()}${p.porque_cai.slice(1)}.` : p.causa}</td>
                </tr>
              );
            })}
            {!lista.length && <tr><td colSpan={7} className="px-4 py-6 text-center text-[#6A6B70]">Nenhuma conexão com esse filtro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
