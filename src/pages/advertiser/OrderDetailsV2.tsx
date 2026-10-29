/**
 * EXA 2.0 — Página do pedido do anunciante.
 * Reaproveita toda a lógica da OrderDetails original (auth, realtime, upload, vídeo principal,
 * contrato, bloqueio, parcelas, modais) e entrega a nova experiência em abas:
 *   Vídeos · Agenda · Prédios · Empresa · Contrato
 * A aba atual fica na URL (?aba=agenda) para a Sofia poder mandar link direto.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, CalendarDays, Check, ChevronRight, Crown, Film, Loader2, Pencil, Receipt, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveAuth as useAuth } from '@/hooks/useEffectiveAuth';
import { useLogoEmpresa } from '@/hooks/exa2/useLogoEmpresa';
import LogoSelo from '@/components/exa2/LogoSelo';
import { useAdvertiserProtection } from '@/hooks/useAdvertiserProtection';
import { useOrderViewTracking } from '@/hooks/tracking/useOrderViewTracking';
import { useVideoActivityTracking } from '@/hooks/tracking/useVideoActivityTracking';
import { useOrderVideoManagement } from '@/hooks/useOrderVideoManagement';
import { useVideoScheduleMonitor } from '@/hooks/useVideoScheduleMonitor';
import { useContractStatus } from '@/hooks/useContractStatus';
import { useEnhancedOrderData } from '@/hooks/useEnhancedOrderData';
import { useSelectedBuildingsDetails } from '@/hooks/useSelectedBuildingsDetails';
import { setBaseVideo as setBaseVideoService, SetBaseVideoResult } from '@/services/videoBaseService';
import { VideoActivationSuccessPopup } from '@/components/video-management/VideoActivationSuccessPopup';
import { VideoConflictModal } from '@/components/video-management/VideoConflictModal';
import { VideoManagementCard } from '@/components/order/VideoManagementCard';
import { BlockedOrderAlert } from '@/components/order/BlockedOrderAlert';
import { CollapsibleContractStatus } from '@/components/order/CollapsibleContractStatus';
import { CollapsibleOrderSummary } from '@/components/order/CollapsibleOrderSummary';
import { CollapsiblePurchaseInfo } from '@/components/order/CollapsiblePurchaseInfo';
import { OrderInstallmentsSection } from '@/components/order/OrderInstallmentsSection';
import { usePedidoAgenda } from '@/hooks/exa2/usePedidoAgenda';
import { winnerAt } from '@/lib/agenda/agendaEngine';
import { usePedidoEmpresas } from '@/hooks/exa2/usePedidoEmpresas';
import { OnAirCard } from '@/components/pedido-v2/OnAirCard';
import { AgendaTab } from '@/components/pedido-v2/AgendaTab';
import { EntregaResumo } from '@/components/pedido-v2/EntregaResumo';
import { PrediosTab } from '@/components/pedido-v2/PrediosTab';
import { EmpresaTab } from '@/components/pedido-v2/EmpresaTab';
import { CARD, EYEBROW } from '@/components/pedido-v2/ui';
import { useVisaoInterna } from '@/hooks/exa2/useVisaoInterna';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';
import { BlocoCarregando } from '@/components/loading/MarcaCarregando';
import { AvisoCobranca, FaturasPedido, useParcelas } from '@/components/cobranca/FaturasPedido';

type Aba = 'videos' | 'agenda' | 'predios' | 'empresa' | 'contrato';
const ABAS: { id: Aba; label: string; icon: React.ElementType }[] = [
  { id: 'videos', label: 'Vídeos', icon: Film },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'predios', label: 'Prédios', icon: Building2 },
  { id: 'empresa', label: 'Empresa', icon: Tag },
  { id: 'contrato', label: 'Contrato', icon: Receipt },
];

const STATUS: Record<string, { t: string; c: string }> = {
  video_aprovado: { t: '● Em exibição', c: 'bg-[#e6f6ec] text-[#13a24a]' },
  ativo: { t: '● Em exibição', c: 'bg-[#e6f6ec] text-[#13a24a]' },
  pago: { t: 'Pago', c: 'bg-[#e6f6ec] text-[#13a24a]' },
  pago_pendente_video: { t: 'Aguardando vídeo', c: 'bg-amber-50 text-amber-700' },
  aguardando_video: { t: 'Aguardando vídeo', c: 'bg-amber-50 text-amber-700' },
  video_enviado: { t: 'Vídeo em aprovação', c: 'bg-blue-50 text-blue-700' },
  aguardando_contrato: { t: 'Aguardando contrato', c: 'bg-amber-50 text-amber-700' },
  pendente: { t: 'Pendente', c: 'bg-amber-50 text-amber-700' },
  expirado: { t: 'Expirado', c: 'bg-gray-100 text-gray-600' },
  cancelado: { t: 'Cancelado', c: 'bg-gray-100 text-gray-600' },
  bloqueado: { t: 'Bloqueado', c: 'bg-red-50 text-red-700' },
};

const fmtData = (s?: string | null) => (s ? new Date(s + (s.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') : '');

const brl = (v?: number | null) => (v || v === 0 ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—');
const CONTRATO: Record<string, { t: string; c: string }> = {
  assinado: { t: 'Assinado', c: 'bg-[#e6f6ec] text-[#13a24a]' },
  enviado: { t: 'Aguardando assinatura', c: 'bg-amber-50 text-amber-700' },
  pendente: { t: 'Aguardando assinatura', c: 'bg-amber-50 text-amber-700' },
  pendente_envio: { t: 'Em preparação', c: 'bg-gray-100 text-gray-600' },
};

/** Aba Contrato: o essencial num cartão só (plano, período com o tempo que falta, valor e assinatura). */
const ContratoResumo: React.FC<{ order: any; orient: string; predios: number }> = ({ order, orient, predios }) => {
  const ini = order.data_inicio ? new Date(order.data_inicio + 'T12:00:00').getTime() : null;
  const fim = order.data_fim ? new Date(order.data_fim + 'T12:00:00').getTime() : null;
  const agora = Date.now();
  const pct = ini && fim && fim > ini ? Math.min(100, Math.max(0, ((agora - ini) / (fim - ini)) * 100)) : null;
  const faltam = fim ? Math.max(0, Math.ceil((fim - agora) / 86400000)) : null;
  const ct = order.contrato_status ? CONTRATO[order.contrato_status] : order.contrato_assinado_em ? CONTRATO.assinado : null;
  const linhas: [string, React.ReactNode][] = [
    ['Plano', `${order.plano_meses || '—'} ${order.plano_meses === 1 ? 'mês' : 'meses'} · ${orient}`],
    ['Prédios', String(predios)],
    ...(order.valor_mensal ? ([['Mensalidade', brl(order.valor_mensal)]] as [string, React.ReactNode][]) : []),
    ['Valor total', brl(order.valor_total)],
    ['Pagamento', order.forma_cobranca === 'boleto' ? `Boleto · todo dia ${order.dia_vencimento || 10}` : order.tipo_pagamento === 'pix_automatico' ? 'Pix Automático' : 'Pix'],
  ];
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-extrabold tracking-tight text-[#1b1719]">Seu contrato</h2>
          {ct && <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${ct.c}`}>{ct.t}</span>}
        </div>
        {pct !== null && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between text-[12.5px]">
              <span className="font-semibold text-[#554e50]">{fmtData(order.data_inicio)} → {fmtData(order.data_fim)}</span>
              <span className="font-bold text-[#1b1719]">{faltam ? `${faltam} dias restantes` : 'Encerrado'}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1b1719]/[0.06]">
              <div className="h-full rounded-full bg-[#9C1E1E]" style={{ width: `${Math.max(2, pct)}%` }} />
            </div>
          </div>
        )}
      </div>
      <dl className="divide-y divide-[#f1edee] border-t border-[#f1edee]">
        {linhas.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[14px] sm:px-5">
            <dt className="text-[#8b8285]">{k}</dt>
            <dd className="text-right font-semibold text-[#1b1719]">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const OrderDetailsV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const aba = (ABAS.find((a) => a.id === params.get('aba'))?.id || 'videos') as Aba;
  const setAba = (a: Aba) => {
    const p = new URLSearchParams(params);
    if (a === 'videos') p.delete('aba'); else p.set('aba', a);
    setParams(p, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { userProfile } = useAuth();
  // Equipe EXA vê os detalhes técnicos de entrega; o cliente vê só o resultado
  const visaoInterna = useVisaoInterna();
  const { isMobile, isTablet } = useMobileBreakpoints();
  const celular = isMobile || isTablet;
  const { isAuthenticated, isLoading: authLoading } = useAdvertiserProtection();
  const { trackOrderView } = useOrderViewTracking();
  const { trackVideoUpload } = useVideoActivityTracking();
  const [order, setOrder] = useState<any | null>(null);
  const logoPedido = useLogoEmpresa(order?.client_id || (userProfile as any)?.id || null, null);
  const [loading, setLoading] = useState(true);
  const [editNome, setEditNome] = useState(false);
  const [nome, setNome] = useState('');

  const contractStatus = useContractStatus(order || { id, data_inicio: undefined, data_fim: undefined, status: 'pendente', plano_meses: 1 });
  const { enhancedData, loading: enhancedLoading } = useEnhancedOrderData(id || '', userProfile?.id || '');
  const buildingIds: string[] = order?.lista_predios || [];
  const { buildings: todosBuildings } = useSelectedBuildingsDetails(buildingIds);
  // Para o cliente só contam prédios ATIVOS: inativos, internos e ids que não existem mais ficam de fora
  // (lista_predios no banco continua intacta — é só a exibição).
  const buildings = useMemo(() => todosBuildings.filter((b) => (b as any).status === 'ativo'), [todosBuildings]);
  const predioIdsAtivos = useMemo(() => buildings.map((b) => b.id), [buildings]);

  const {
    videoSlots, uploading, uploadProgress, activateVideo, removeVideo, uploadVideo, refreshSlots,
    isSuccessOpen, videoName, isMasterApproved, isBaseActivated, hideSuccess, conflictModal, tipoProduto,
  } = useOrderVideoManagement(id || '');

  useVideoScheduleMonitor({ orderId: id || '', enabled: true, intervalMinutes: 45, enableRealtime: false, onDataChange: refreshSlots });

  const agenda = usePedidoAgenda(id || '', order?.client_id, videoSlots);
  // Vídeo da vez segundo o motor de agenda (o mesmo que monta a programação das telas): só ele aparece "em exibição"
  const [minutoAgenda, setMinutoAgenda] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => { const t = setInterval(() => setMinutoAgenda(Math.floor(Date.now() / 60000)), 20000); return () => clearInterval(t); }, []);
  const slotNoArId = useMemo(() => winnerAt(agenda.slots, agenda.rules, new Date())?.slot.id || null, [agenda.slots, agenda.rules, minutoAgenda]); // eslint-disable-line react-hooks/exhaustive-deps
  const videoSlotsComNoAr = useMemo(() => videoSlots.map((s: any) => (s?.id && s.approval_status === 'approved' ? { ...s, _noArAgora: s.id === slotNoArId } : s)), [videoSlots, slotNoArId]);
  const empresas = usePedidoEmpresas(id || '', order?.client_id);
  const { parcelas } = useParcelas(id || null);

  // ---- carregar pedido + tempo real (igual à página original) ----
  const loadOrder = async () => {
    if (!id || !userProfile?.id) return;
    try {
      const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).eq('client_id', userProfile.id).single();
      if (error) throw error;
      if (!data) {
        toast.error('Pedido não encontrado. Pode ter sido removido.');
        navigate('/anunciante/pedidos');
        return;
      }
      setOrder(data);
      setNome((data.nome_pedido || '').replace(/^\s*EXA\s*[-–—:]\s*/i, ''));
      trackOrderView(data.id);
    } catch (e: any) {
      toast.error(`Erro ao carregar o pedido: ${e.message || 'erro desconhecido'}`);
      navigate('/anunciante/pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id || !userProfile?.id) { setLoading(false); return; }
    loadOrder();
    const ch = supabase
      .channel(`order-detail-v2-${id}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, () => {
        toast.error('Este pedido foi removido pelo administrador');
        navigate('/anunciante/pedidos');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, () => loadOrder())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, userProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- ações de vídeo (iguais à página original) ----
  const handleVideoUpload = async (slotPosition: number, file: File, title: string, scheduleRules?: any[], qrConfig?: any) => {
    if (!userProfile?.id || !id) { toast.error('Dados do usuário ou pedido indisponíveis'); return; }
    if (contractStatus.isExpired) { toast.error('Não é possível enviar vídeos com o contrato expirado'); return; }
    await uploadVideo(slotPosition, file, userProfile.id, title, scheduleRules, qrConfig);
    await refreshSlots();
    const up = videoSlots.find((s) => s.slot_position === slotPosition);
    if (up?.video_data?.id) await trackVideoUpload(up.video_data.id, id);
  };
  const guard = async (fn: () => Promise<void>) => {
    if (contractStatus.isExpired) { toast.error('Não é possível alterar vídeos com o contrato expirado'); return; }
    await fn();
  };
  const handleSetBase = async (slotId: string) => {
    toast.loading('Definindo como vídeo principal...', { id: 'set-base' });
    try {
      const r: SetBaseVideoResult = await setBaseVideoService(slotId);
      if (r.success) {
        toast.success('Vídeo principal definido!', { id: 'set-base', description: 'Ele toca sempre que não houver outro programado.' });
        await refreshSlots();
      } else toast.error('Erro ao definir vídeo principal', { id: 'set-base', description: r.message });
    } catch (e: any) {
      toast.error('Erro ao definir vídeo principal', { id: 'set-base', description: e.message });
    }
  };

  const salvarNome = async () => {
    try {
      const { error } = await supabase.rpc('set_pedido_nome', { p_pedido_id: id, p_nome: nome.trim() });
      if (error) throw error;
      setOrder((o: any) => ({ ...o, nome_pedido: nome.trim() || null }));
      setEditNome(false);
      toast.success('Nome do pedido atualizado');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar o nome');
    }
  };

  const serverActive = videoSlots.find((s) => s.is_active && s.selected_for_display)?.id || null;

  // ---- estados de carregamento / erro ----
  if (authLoading || !isAuthenticated || loading || enhancedLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><BlocoCarregando largura={110} /></div>;
  }
  if (!order) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h3 className="mb-1 text-lg font-bold">Pedido não encontrado</h3>
        <button onClick={() => navigate('/anunciante/pedidos')} className="mt-3 rounded-xl bg-[#9C1E1E] px-4 py-2 text-sm font-bold text-white">Voltar para Meus Pedidos</button>
      </div>
    );
  }

  const bloqueado = order.status === 'bloqueado';
  // Contrato pendente so trava quando o pedido ainda nao saiu da etapa de contrato (assinou -> status avanca e libera)
  const aguardandoContrato = order.status === 'aguardando_contrato' || (['pendente', 'aguardando_contrato'].includes(order.status) && ['enviado', 'pendente', 'pendente_envio'].includes(order.contrato_status));
  const gestaoTravada = contractStatus.isExpired || aguardandoContrato || bloqueado;
  const st = STATUS[order.status] || { t: order.status, c: 'bg-gray-100 text-gray-600' };
  const displayPanels = enhancedData?.recoveredPanels || order.lista_paineis || [];
  const totalScreens = buildings.reduce((s, b) => s + (b.quantidade_telas || b.numero_elevadores || 0), 0);
  const totalAudience = buildings.reduce((s, b) => s + (b.publico_estimado || 0), 0);
  const aprovados = videoSlots.filter((s) => s.video_id && s.approval_status === 'approved').length;
  const comVideo = videoSlots.filter((s) => s.video_id).length;
  const orient = tipoProduto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal';

  const AvisoTravado = () =>
    contractStatus.isExpired ? (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <h3 className="font-bold text-gray-800">Gestão bloqueada</h3>
        <p className="text-sm text-gray-500">O contrato expirou. Renove para reativar seus vídeos.</p>
      </div>
    ) : aguardandoContrato ? (
      <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-600" />
        <h3 className="font-bold text-amber-800">{order.status === 'aguardando_contrato' ? 'Contrato aguardando assinatura' : 'Assinatura de contrato pendente'}</h3>
        <p className="text-sm text-amber-700">Verifique seu e-mail e assine o contrato para liberar o envio de vídeos.</p>
      </div>
    ) : null;

  return (
    <>
      <div className="text-[#1b1719] antialiased">
        <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
          {/* No celular o "voltar" fica no topo do app (seta + Pedidos) — sem repetir aqui */}
          {!celular && (
            <button onClick={() => navigate('/anunciante/pedidos')} className="inline-flex items-center gap-1 text-sm font-bold text-[#9C1E1E] hover:underline">
              <ArrowLeft className="h-4 w-4" /> Meus pedidos
            </button>
          )}

          {/* Cabeçalho do pedido */}
          <header className="flex items-start gap-3 sm:gap-4">
            <LogoSelo src={logoPedido} fallback={(order.nome_pedido || 'E').replace(/^\s*EXA\s*[-–—:]\s*/i, '').charAt(0).toUpperCase()} className="mt-1 hidden h-[72px] w-[72px] sm:flex" rounded="rounded-[20px]" pad="p-2" />
            <div className="min-w-0 flex-1">
              {!celular && <div className={EYEBROW}>Seu pedido</div>}
              {editNome ? (
                <div className="mt-1 flex gap-2">
                  <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salvarNome()} maxLength={80} className="min-w-0 flex-1 rounded-xl border border-[#9C1E1E] bg-white px-3 py-2 text-lg font-extrabold outline-none" />
                  <button onClick={salvarNome} className="rounded-xl bg-[#9C1E1E] px-3 text-white"><Check className="h-5 w-5" /></button>
                  <button onClick={() => { setEditNome(false); setNome(order.nome_pedido || ''); }} className="rounded-xl border border-[#ebe6e7] bg-white px-3 text-[#8b8285]"><X className="h-5 w-5" /></button>
                </div>
              ) : (
                <button onClick={() => setEditNome(true)} title="Renomear pedido" className="group flex max-w-full items-center gap-2 text-left">
                  <h1 className="truncate text-[24px] font-extrabold leading-tight tracking-tight text-[#1b1719] sm:text-3xl">{(order.nome_pedido || '').replace(/^\s*EXA\s*[-–—:]\s*/i, '').trim() || `Pedido #${order.id.slice(0, 8)}`}</h1>
                  <Pencil className="h-4 w-4 flex-none text-[#c9c1c3] group-hover:text-[#9C1E1E]" />
                </button>
              )}
              <p className="mt-0.5 text-[13px] text-[#8b8285]">
                {!celular && <>#{order.id.slice(0, 8)} · </>}
                {order.data_inicio && order.data_fim && <>{fmtData(order.data_inicio)} → {fmtData(order.data_fim)}</>}
                {' · '}{buildings.length} {buildings.length === 1 ? 'prédio' : 'prédios'}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${st.c}`}>{st.t}</span>
                {order.is_master && <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1.5 text-[12px] font-bold text-amber-950"><Crown className="h-3 w-3" /> Master</span>}
                {!celular && <span className={`${CARD} rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#554e50]`}>{orient}</span>}
                {!celular && comVideo > 0 && <span className={`${CARD} rounded-full px-3 py-1.5 text-[12px] font-semibold text-[#554e50]`}>{aprovados}/{comVideo} vídeos aprovados</span>}
              </div>
            </div>
          </header>

          {order.blocked_reason && !/falta de pagamento|pagamento não identificado/i.test(order.blocked_reason) && <BlockedOrderAlert reason={order.blocked_reason} blockedAt={order.blocked_at} />}
          <AvisoCobranca pedido={order} parcelas={parcelas} />

          {/* Abas — celular: controle segmentado (ícone + nome), 5 colunas iguais, preso logo abaixo do topo do app */}
          {celular ? (
            <nav className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 -mx-4 bg-[#f3f1f2]/95 px-4 pb-2 pt-1 backdrop-blur-md">
              <div className="grid grid-cols-5 gap-0.5 rounded-[16px] bg-[#e9e4e5] p-1">
                {ABAS.map(({ id: a, label, icon: I }) => (
                  <button
                    key={a}
                    onClick={() => setAba(a)}
                    aria-current={aba === a ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-[12px] py-1.5 text-[11px] font-bold transition ${aba === a ? 'bg-white text-[#9C1E1E] shadow-[0_1px_3px_rgba(30,15,18,.14)]' : 'text-[#8b8285]'}`}
                  >
                    <I className="h-[18px] w-[18px]" strokeWidth={aba === a ? 2.3 : 1.9} />
                    {label}
                  </button>
                ))}
              </div>
            </nav>
          ) : (
          <nav className="sticky top-0 z-20 -mx-4 bg-[#f3f1f2]/85 px-4 py-2 backdrop-blur-md sm:mx-0 sm:px-0">
            <div className={`${CARD} flex gap-1 overflow-x-auto p-1`}>
              {ABAS.map(({ id: a, label, icon: I }) => (
                <button
                  key={a}
                  onClick={() => setAba(a)}
                  aria-current={aba === a ? 'page' : undefined}
                  className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[14px] px-3.5 py-2.5 text-sm font-bold transition ${aba === a ? 'bg-[#9C1E1E] text-white shadow-[0_6px_16px_-8px_rgba(156,30,30,.8)]' : 'text-[#8b8285] hover:bg-[#f7f5f6] hover:text-[#1b1719]'}`}
                >
                  <I className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </nav>
          )}

          {aba === 'videos' && (
            <div>
              <div className="min-w-0 space-y-5">
                {!bloqueado && (
                  <section>
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-0.5">
                      <h2 className="text-lg font-extrabold tracking-tight text-[#1b1719]">No ar agora</h2>
                      {/* Confirmação por prédio (vigia das telas): só para a equipe EXA */}
                      {visaoInterna && (
                        <div className="[&>*]:!m-0 [&>*]:!shadow-none [&>*]:!bg-transparent [&>*]:!p-0 text-xs">
                          <EntregaResumo buildingIds={predioIdsAtivos} />
                        </div>
                      )}
                    </div>
                    <OnAirCard
                      slots={agenda.slots}
                      rules={agenda.rules}
                      totalPredios={buildings.length}
                      serverActiveSlotId={serverActive}
                      onAgendar={() => setAba('agenda')}
                      onVerTela={() => setAba('predios')}
                      onEnviar={gestaoTravada ? undefined : () => document.getElementById('seus-videos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    />
                  </section>
                )}
                {gestaoTravada ? (
                  <AvisoTravado />
                ) : (
                  <section id="seus-videos" className={`${CARD} scroll-mt-24 overflow-hidden`}>
                    <div className="flex items-center gap-3 border-b border-[#f1edee] px-4 py-3.5 sm:px-5">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#f8e9ec] text-[#9e1b34]"><Film className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-extrabold tracking-tight text-[#1b1719]">Seus vídeos</h2>
                        <p className="text-xs text-[#8b8285]">Envie, aprove e defina o principal. {comVideo > 0 && `${comVideo} enviado(s) · ${aprovados} aprovado(s)`}</p>
                      </div>
                    </div>
                    {/* Gestão de vídeos (componente legado: upload, aprovação, principal) */}
                    <div className="exa2-gestao-videos [&>div]:border-0 [&>div]:shadow-none">
                      <VideoManagementCard
                        orderStatus={order.status}
                        videoSlots={videoSlotsComNoAr}
                        uploading={uploading}
                        uploadProgress={uploadProgress}
                        onUpload={handleVideoUpload}
                        onActivate={(slotId) => guard(() => activateVideo(slotId))}
                        onRemove={(slotId) => guard(() => removeVideo(slotId))}
                        onDownload={(url) => window.open(url, '_blank')}
                        onSetBaseVideo={(slotId) => guard(() => handleSetBase(slotId))}
                        onRefreshSlots={refreshSlots}
                        orderId={id || ''}
                        tipoProduto={tipoProduto}
                        semCabecalho
                      />
                    </div>
                  </section>
                )}
              </div>
              {agenda.historico.length > 0 && (
                <section className={`${CARD} mt-5 p-4`}>
                  <div className="mb-2 flex items-end justify-between gap-2">
                    <h3 className="text-base font-extrabold text-[#1b1719]">Histórico</h3>
                    <span className="text-[11px] font-semibold text-[#8b8285]">guardado por 30 dias</span>
                  </div>
                  {agenda.historico.length === 0 ? (
                    <p className="rounded-xl bg-[#f7f5f6] p-3 text-center text-xs text-[#8b8285]">Nenhum vídeo removido ainda.</p>
                  ) : (
                    <div className="divide-y divide-[#f1edee]">
                      {agenda.historico.map((h) => (
                        <div key={h.id} className="flex items-center gap-3 py-2">
                          {h.thumbnail_url ? <img src={h.thumbnail_url} alt="" className="h-10 w-14 rounded-lg object-cover" /> : <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[#f7f5f6]"><Film className="h-4 w-4 text-[#b3aaad]" /></div>}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-[#1b1719]">{h.video_nome || 'Vídeo'}</div>
                            <div className="truncate text-xs text-[#8b8285]">{h.resumo_uso || h.periodo || ''}</div>
                          </div>
                          <div className="text-right text-[10.5px] text-[#8b8285]">
                            {fmtData(h.created_at.slice(0, 10))}
                            <br />
                            {h.arquivo_excluido ? 'arquivo apagado' : 'arquivo guardado'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

            </div>
          )}

          {aba === 'agenda' && (
            <>
              {gestaoTravada && <AvisoTravado />}
              <AgendaTab
                slots={agenda.slots}
                rules={agenda.rules}
                saving={agenda.saving}
                entrega={agenda.entrega}
                onReenviar={agenda.sincronizarPaineis}
                dataInicio={order.data_inicio}
                dataFim={order.data_fim}
                disabled={gestaoTravada}
                checarConflitos={agenda.checarConflitos}
                salvarProgramacao={agenda.salvarProgramacao}
                removerProgramacao={agenda.removerProgramacao}
                onIrParaVideos={() => setAba('videos')}
              />
            </>
          )}

          {aba === 'predios' && (
            <PrediosTab predios={buildings as any} slots={agenda.slots} rules={agenda.rules} serverActiveSlotId={serverActive} bloqueado={bloqueado} visaoInterna={visaoInterna} />
          )}

          {aba === 'empresa' && (
            <EmpresaTab
              marcas={empresas.marcas}
              ficha={empresas.ficha}
              arquivos={empresas.arquivos}
              loading={empresas.loading}
              busy={empresas.busy}
              disabled={bloqueado}
              criarEmpresa={empresas.criarEmpresa}
              atualizarEmpresa={empresas.atualizarEmpresa}
              salvarCampo={empresas.salvarCampo}
              adicionarCampo={empresas.adicionarCampo}
              enviarArquivo={empresas.enviarArquivo}
              removerArquivo={empresas.removerArquivo}
            />
          )}

          {aba === 'contrato' && (
            <div className="space-y-3">
              <ContratoResumo order={order} orient={orient} predios={buildings.length} />
              <FaturasPedido pedido={order} parcelas={parcelas} />
              <div className="px-0.5 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a39a9d]">Mais detalhes</div>
              <CollapsibleContractStatus orderId={order.id} orderDetails={order} />
              {order.is_fidelidade && order.total_parcelas && (
                <OrderInstallmentsSection orderId={order.id} tipoPagamento={order.tipo_pagamento || 'pix_fidelidade'} totalParcelas={order.total_parcelas} />
              )}
              <CollapsibleOrderSummary orderDetails={order} displayPanels={displayPanels} isRecovered={enhancedData?.isRecovered} totalScreens={totalScreens} totalAudience={totalAudience} />
              <CollapsiblePurchaseInfo orderDetails={order} />
            </div>
          )}
        </div>
      </div>

      <VideoActivationSuccessPopup isOpen={isSuccessOpen} onClose={hideSuccess} videoName={videoName} isMasterApproved={isMasterApproved} isBaseActivated={isBaseActivated} />
      <VideoConflictModal isOpen={conflictModal.isOpen} onClose={conflictModal.hideConflictModal} conflicts={conflictModal.conflicts} suggestions={conflictModal.suggestions} newVideoName={conflictModal.newVideoName} />
    </>
  );
};

export default OrderDetailsV2;
