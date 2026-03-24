import React, { useState } from 'react';
import { Calendar, User, Mail, CreditCard, MapPin, Video, CheckCircle2, XCircle, Clock, FileText, TrendingUp, Shield, RefreshCw, Upload, Key, Loader2, Send, Monitor, Smartphone, Plus, Trash2, ChevronDown, Building } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import exaLogo from '@/assets/exa-logo.png';
import { Button } from '@/components/ui/button';
import { useFixAuditData } from '@/hooks/admin/useFixAuditData';
import { resyncVideoToExternalAPI } from '@/services/videoExternalSyncService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrderBuildingsManagement } from '@/hooks/useOrderBuildingsManagement';
import { BuildingManagementDialog } from './BuildingManagementDialog';
import { OrderNameEdit } from '@/components/order/OrderNameEdit';
import { useCurrentVideoDisplay } from '@/hooks/useCurrentVideoDisplay';
interface Parcela {
  id: string;
  numero_parcela: number;
  valor_original: number;
  valor_final: number;
  data_vencimento: string;
  status: string;
  data_pagamento?: string | null;
  metodo_pagamento?: string | null;
}
interface OrderData {
  id: string;
  created_at: string;
  status: string;
  client_name: string;
  client_email: string;
  valor_total: number;
  data_inicio?: string;
  data_fim?: string;
  plano_meses: number;
  log_pagamento?: any;
  compliance_data?: any;
  cupom_id?: string;
  termos_aceitos?: boolean;
  tipo_produto?: string;
  lista_predios?: string[];
  ip_origem?: string;
  device_info?: any;
  expires_at?: string;
  nome_pedido?: string;
  // Campos de fidelidade
  tipo_pagamento?: string;
  metodo_pagamento?: string;
  is_fidelidade?: boolean;
  dia_vencimento?: number;
  parcela_atual?: number;
  total_parcelas?: number;
  status_adimplencia?: string;
  // Campos do termo aceito
  termo_aceito_em?: string;
  dados_empresa_termo?: {
    cnpj?: string;
    razao_social?: string;
    nomeEmpresa?: string;
  };
  versao_termo?: string;
  // Parcelas
  parcelas?: Parcela[];
}
interface PanelData {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
}
interface OrderVideo {
  id: string;
  slot_position: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  selected_for_display: boolean;
  created_at?: string;
  uploaded_at?: string;
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
}
interface ProfessionalOrderReportProps {
  order: OrderData;
  panels: PanelData[];
  videos: OrderVideo[];
  onBuildingChanged?: () => void;
}
export const ProfessionalOrderReport: React.FC<ProfessionalOrderReportProps> = ({
  order,
  panels,
  videos,
  onBuildingChanged
}) => {
  console.log('📋 [PROFESSIONAL REPORT] Renderizando relatório');
  console.log('📋 [PROFESSIONAL REPORT] Panels recebidos:', panels?.length || 0);
  console.log('📋 [PROFESSIONAL REPORT] Panels data:', panels);
  console.log('📋 [PROFESSIONAL REPORT] Videos recebidos:', videos?.length || 0);
  const [resyncingVideoId, setResyncingVideoId] = useState<string | null>(null);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);
  const [showAddBuildingDialog, setShowAddBuildingDialog] = useState(false);
  const [removingBuildingId, setRemovingBuildingId] = useState<string | null>(null);
  
  // RPC como fonte da verdade para vídeo em exibição
  const { currentVideo } = useCurrentVideoDisplay({ orderId: order.id, enabled: !!order.id });
  const currentVideoId = currentVideo?.video_id || null;
  const {
    fixOrderAuditData,
    isFixing
  } = useFixAuditData();
  const { addBuildings, removeBuilding, loading: buildingsLoading } = useOrderBuildingsManagement();

  const handleResyncVideo = async (pedidoVideoId: string) => {
    setResyncingVideoId(pedidoVideoId);
    try {
      await resyncVideoToExternalAPI(pedidoVideoId);
    } finally {
      setResyncingVideoId(null);
    }
  };

  const handleResendPasswordLink = async () => {
    if (!order.client_email) {
      toast.error('Email do cliente não encontrado');
      return;
    }

    setSendingPasswordReset(true);
    try {
      const { isRateLimitError, extractWaitSeconds, setCooldown, getRemainingCooldown } = await import('@/utils/resetPasswordCooldown');

      const remaining = getRemainingCooldown(order.client_email);
      if (remaining > 0) {
        toast.error(`Aguarde ${remaining} segundos antes de tentar novamente`);
        setSendingPasswordReset(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(order.client_email, {
        redirectTo: `${window.location.origin}/definir-senha`
      });

      if (error) {
        if (isRateLimitError(error)) {
          const wait = extractWaitSeconds(error.message) || 60;
          setCooldown(order.client_email, wait);
          toast.error(`Aguarde ${wait} segundos antes de tentar novamente`);
          return;
        }
        throw error;
      }

      setCooldown(order.client_email, 60);
      toast.success(`Link de senha enviado para ${order.client_email}`);
    } catch (err: any) {
      console.error('Erro ao enviar link de senha:', err);
      toast.error(err.message || 'Erro ao enviar link de senha');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  // Verificar se os dados de auditoria estão incompletos
  const hasIncompleteAuditData = !order.compliance_data || !order.compliance_data.payer || order.log_pagamento?.pixData?.mpResponse?.status === 'pending';

  // Calcular status correto baseado em vídeos
  const getCorrectStatus = (orderStatus: string, videosCount: number) => {
    // Se pedido pago/ativo mas sem vídeos -> Aguardando Vídeo
    if ((orderStatus === 'pago' || orderStatus === 'ativo') && videosCount === 0) {
      return 'pago_pendente_video';
    }
    return orderStatus;
  };
  const correctStatus = getCorrectStatus(order.status, videos.length);

  // Ordenar vídeos: em exibição primeiro
  const sortedVideos = [...videos].sort((a, b) => {
    if (a.selected_for_display && !b.selected_for_display) return -1;
    if (!a.selected_for_display && b.selected_for_display) return 1;
    return a.slot_position - b.slot_position;
  });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatSimpleDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const getStatusConfig = (status: string) => {
    const configs: Record<string, {
      bg: string;
      text: string;
      label: string;
      icon: React.ReactNode;
    }> = {
      'pago_pendente_video': {
        bg: 'bg-orange-500',
        text: 'text-white',
        label: 'Aguardando Vídeo',
        icon: <Clock className="h-4 w-4" />
      },
      'video_enviado': {
        bg: 'bg-blue-500',
        text: 'text-white',
        label: 'Vídeo Enviado',
        icon: <Video className="h-4 w-4" />
      },
      'video_aprovado': {
        bg: 'bg-green-500',
        text: 'text-white',
        label: 'Vídeo Aprovado',
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      'pago': {
        bg: 'bg-green-500',
        text: 'text-white',
        label: 'Pago',
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      'ativo': {
        bg: 'bg-green-500',
        text: 'text-white',
        label: 'Ativo',
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      'pendente': {
        bg: 'bg-gray-500',
        text: 'text-white',
        label: 'Pendente',
        icon: <Clock className="h-4 w-4" />
      },
      'cancelado': {
        bg: 'bg-red-500',
        text: 'text-white',
        label: 'Cancelado',
        icon: <XCircle className="h-4 w-4" />
      }
    };
    return configs[status] || {
      bg: 'bg-gray-500',
      text: 'text-white',
      label: status,
      icon: <FileText className="h-4 w-4" />
    };
  };
  const statusConfig = getStatusConfig(correctStatus);
  const emittedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const subtotal = order.valor_total;
  const desconto = order.cupom_id ? subtotal * 0.1 : 0;
  return <><div className="w-full max-w-7xl mx-auto bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER MINIMALISTA PROFISSIONAL - RESPONSIVO */}
      <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] text-white px-4 lg:px-6 py-4 lg:py-5 border-b-2 border-gray-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Logo e Info */}
          <div className="flex items-center gap-4 lg:gap-6">
            <img src={exaLogo} alt="EXA" className="h-8 lg:h-10 w-auto brightness-0 invert" />
            <div className="border-l border-white/30 pl-4 lg:pl-6">
              <p className="text-[10px] lg:text-xs text-white/80 mb-0.5">Relatório de Pedido</p>
              {order.nome_pedido ? (
                <>
                  <p className="text-sm lg:text-base font-bold">{order.nome_pedido}</p>
                  <p className="text-[10px] lg:text-xs text-white/70 font-mono">#{order.id.substring(0, 8).toUpperCase()}</p>
                </>
              ) : (
                <p className="text-xs lg:text-sm font-semibold">#{order.id.substring(0, 8).toUpperCase()}</p>
              )}
            </div>
          </div>
          
          {/* Info Rápida - Responsivo */}
          <div className="flex flex-wrap items-center gap-3 lg:gap-6 text-xs w-full lg:w-auto">
            <div className="min-w-0">
              <p className="text-white/70 text-[10px] lg:text-xs">Cliente</p>
              <p className="font-semibold truncate max-w-[120px] sm:max-w-[180px] lg:max-w-none">{order.client_name}</p>
            </div>
            <div>
              <p className="text-white/70 text-[10px] lg:text-xs">Valor</p>
              <p className="font-semibold">{formatCurrency(order.valor_total)}</p>
            </div>
            <div className={`${statusConfig.bg} ${statusConfig.text} px-2 lg:px-3 py-1 lg:py-1.5 rounded text-[10px] lg:text-xs font-semibold flex items-center gap-1 lg:gap-1.5`}>
              {statusConfig.icon}
              <span className="hidden sm:inline">{statusConfig.label}</span>
            </div>
            <div className="text-white/70 text-right hidden sm:block">
              <p className="text-[10px]">Emitido em</p>
              <p className="font-medium text-[10px] lg:text-xs">{emittedAt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL - MINIMALISTA */}
      <div className="px-6 py-6 space-y-6">

        {/* SEÇÃO: NOME DO PEDIDO */}
        <OrderNameEdit orderId={order.id} currentName={order.nome_pedido} />
        
        {/* SEÇÃO: INFORMAÇÕES DO PEDIDO */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Informações do Pedido</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Tipo de Produto</p>
                <p className="font-semibold text-gray-900">
                  {order.tipo_produto === 'vertical_premium' ? (
                    <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md text-xs font-semibold">
                      <Smartphone className="h-3 w-3" />
                      Vertical Premium
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs font-semibold">
                      <Monitor className="h-3 w-3" />
                      Horizontal
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Data de Criação</p>
                <p className="font-semibold text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Plano Contratado</p>
                <p className="font-semibold text-gray-900">{order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Início da Vigência</p>
                <p className="font-semibold text-gray-900">{formatSimpleDate(order.data_inicio)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Término da Vigência</p>
                <p className="font-semibold text-gray-900">{formatSimpleDate(order.data_fim)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: DADOS DO CLIENTE */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Dados do Cliente</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Nome Completo</p>
                <p className="font-semibold text-gray-900">{order.client_name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">E-mail</p>
                <p className="font-semibold text-gray-900">{order.client_email}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Termos Aceitos</p>
                <p className="font-semibold text-gray-900">
                  {order.termos_aceitos ? <span className="inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Sim {order.termo_aceito_em && `- ${formatDate(order.termo_aceito_em)}`}
                    </span> : <span className="inline-flex items-center gap-1 text-red-700">
                      <XCircle className="h-3 w-3" />
                      Não
                    </span>}
                </p>
              </div>
            </div>
            
            {/* Dados da empresa do termo de fidelidade */}
            {order.dados_empresa_termo && (order.dados_empresa_termo.razao_social || order.dados_empresa_termo.nomeEmpresa || order.dados_empresa_termo.cnpj) && <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-gray-500 mb-2 text-xs font-semibold">Dados da Empresa (Termo Fidelidade)</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {(order.dados_empresa_termo.razao_social || order.dados_empresa_termo.nomeEmpresa) && <div>
                      <p className="text-gray-500 mb-1">Razão Social</p>
                      <p className="font-semibold text-gray-900">
                        {order.dados_empresa_termo.razao_social || order.dados_empresa_termo.nomeEmpresa}
                      </p>
                    </div>}
                  {order.dados_empresa_termo.cnpj && <div>
                      <p className="text-gray-500 mb-1">CNPJ</p>
                      <p className="font-semibold text-gray-900">{order.dados_empresa_termo.cnpj}</p>
                    </div>}
                </div>
              </div>}

            {/* Botão Reenviar Link de Senha */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={handleResendPasswordLink}
                disabled={sendingPasswordReset}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {sendingPasswordReset ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Key className="h-3 w-3 mr-1.5" />
                    Reenviar Link de Senha
                  </>
                )}
              </Button>
              <p className="text-[10px] text-gray-500 mt-1">
                Envia um novo link para {order.client_email} definir/redefinir a senha
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO: RESUMO FINANCEIRO */}
        <section className="border border-gray-200 rounded bg-gray-50">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Resumo Financeiro</h2>
          </div>
          
          <div className="p-4">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">{formatCurrency(subtotal + desconto)}</span>
              </div>
              
              {desconto > 0 && <div className="flex justify-between items-center text-green-700">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Desconto
                  </span>
                  <span className="font-semibold">-{formatCurrency(desconto)}</span>
                </div>}
              
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="text-lg font-black text-gray-900">{formatCurrency(order.valor_total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: DADOS DE PAGAMENTO */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Dados de Pagamento</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-gray-500 mb-1">Tipo de Pagamento</p>
                <p className="font-semibold text-gray-900">
                  {order.tipo_pagamento === 'personalizado' && '💳 Condição Personalizada'}
                  {order.metodo_pagamento === 'personalizado' && !order.tipo_pagamento && '💳 Condição Personalizada'}
                  {order.tipo_pagamento === 'pix_avista' && 'PIX à Vista'}
                  {order.tipo_pagamento === 'pix_fidelidade' && 'PIX Fidelidade'}
                  {order.tipo_pagamento === 'boleto_fidelidade' && 'Boleto Fidelidade'}
                  {order.tipo_pagamento === 'cartao' && 'Cartão de Crédito'}
                  {!order.tipo_pagamento && order.metodo_pagamento !== 'personalizado' && (order.log_pagamento?.method === 'pix' ? 'PIX' : order.metodo_pagamento || 'Não informado')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Modalidade</p>
                <p className="font-semibold text-gray-900">
                  {order.is_fidelidade ? <span className="inline-flex items-center gap-1 text-blue-700">
                      <CreditCard className="h-3 w-3" />
                      Assinatura Fidelidade
                    </span> : <span className="text-gray-700">Pagamento Único</span>}
                </p>
              </div>
              {order.is_fidelidade && <>
                  <div>
                    <p className="text-gray-500 mb-1">Parcela Atual</p>
                    <p className="font-semibold text-gray-900">
                      {order.parcela_atual || 1} / {order.total_parcelas || order.plano_meses}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Dia de Vencimento</p>
                    <p className="font-semibold text-gray-900">
                      Dia {order.dia_vencimento || 'N/A'}
                    </p>
                  </div>
                </>}
            </div>
            
            {/* Badge de Status de Adimplência - Corrigido */}
            {order.is_fidelidade && <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Status de Adimplência:</span>
                  {/* Verificar se há parcelas pagas para determinar status correto */}
                  {order.parcelas && order.parcelas.some(p => p.status === 'pago') ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Em Dia
                    </span> : order.status_adimplencia === 'em_dia' && order.parcela_atual && order.parcela_atual > 1 ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Em Dia
                    </span> : order.status_adimplencia === 'atrasado' ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Atrasado
                    </span> : order.status_adimplencia === 'suspenso' ? <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                      <XCircle className="h-3.5 w-3.5" />
                      Suspenso
                    </span> : <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Aguardando Pagamento
                    </span>}
                </div>
              </div>}

            {/* NOVA SEÇÃO: Detalhes das Parcelas */}
            {order.parcelas && order.parcelas.length > 0 && (() => {
            // Calcular totais
            const totalPago = order.parcelas.filter(p => p.status === 'pago').reduce((sum, p) => sum + (p.valor_final || 0), 0);
            const totalPendente = order.parcelas.filter(p => p.status === 'pendente').reduce((sum, p) => sum + (p.valor_final || 0), 0);
            const totalAtrasado = order.parcelas.filter(p => p.status === 'atrasado').reduce((sum, p) => sum + (p.valor_final || 0), 0);
            const saldoDevedor = totalPendente + totalAtrasado;
            const parcelasPagas = order.parcelas.filter(p => p.status === 'pago').length;
            const parcelasPendentes = order.parcelas.filter(p => p.status === 'pendente').length;
            const parcelasAtrasadas = order.parcelas.filter(p => p.status === 'atrasado').length;
            return <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Detalhes das Parcelas ({order.parcelas.length} parcelas)
                  </h3>

                  {/* CARD DE SALDO DEVEDOR */}
                  <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-[10px] text-green-600 font-medium mb-1">✅ Total Recebido</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(totalPago)}</p>
                      <p className="text-[10px] text-green-600">{parcelasPagas} parcela{parcelasPagas !== 1 ? 's' : ''} paga{parcelasPagas !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-[10px] text-amber-600 font-medium mb-1">⏳ A Receber</p>
                      <p className="text-lg font-bold text-amber-700">{formatCurrency(totalPendente)}</p>
                      <p className="text-[10px] text-amber-600">{parcelasPendentes} parcela{parcelasPendentes !== 1 ? 's' : ''} pendente{parcelasPendentes !== 1 ? 's' : ''}</p>
                    </div>
                    {totalAtrasado > 0 && <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-[10px] text-red-600 font-medium mb-1">🚨 Em Atraso</p>
                        <p className="text-lg font-bold text-red-700">{formatCurrency(totalAtrasado)}</p>
                        <p className="text-[10px] text-red-600">{parcelasAtrasadas} parcela{parcelasAtrasadas !== 1 ? 's' : ''} atrasada{parcelasAtrasadas !== 1 ? 's' : ''}</p>
                      </div>}
                    
                  </div>

                  {/* BARRA DE PROGRESSO */}
                  <div className="mb-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" style={{
                  width: `${order.valor_total > 0 ? totalPago / order.valor_total * 100 : 0}%`
                }} />
                  </div>
                  <p className="text-[10px] text-gray-500 text-center mb-4">
                    {order.valor_total > 0 ? Math.round(totalPago / order.valor_total * 100) : 0}% do contrato quitado
                  </p>

                  {/* LISTA DE PARCELAS */}
                  <div className="space-y-2">
                    {order.parcelas.map(parcela => <div key={parcela.id} className={`flex items-center justify-between p-2 rounded text-xs ${parcela.status === 'pago' ? 'bg-green-50 border border-green-200' : parcela.status === 'atrasado' ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${parcela.status === 'pago' ? 'bg-green-500 text-white' : parcela.status === 'atrasado' ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {parcela.numero_parcela}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(parcela.valor_final)}
                            </p>
                            <p className="text-gray-500">
                              Vence: {formatSimpleDate(parcela.data_vencimento)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {parcela.status === 'pago' ? <div className="flex items-center gap-1.5 text-green-700">
                              <CheckCircle2 className="h-4 w-4" />
                              <div>
                                <p className="font-semibold">Pago</p>
                                {parcela.data_pagamento && <p className="text-[10px] text-green-600">
                                    em {formatSimpleDate(parcela.data_pagamento)}
                                  </p>}
                              </div>
                            </div> : parcela.status === 'atrasado' ? <div className="flex items-center gap-1.5 text-red-700">
                              <XCircle className="h-4 w-4" />
                              <span className="font-semibold">Atrasado</span>
                            </div> : <div className="flex items-center gap-1.5 text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold">Pendente</span>
                            </div>}
                        </div>
                      </div>)}
                  </div>
                </div>;
          })()}
          </div>
        </section>

        {/* SEÇÃO: INFORMAÇÕES DE PAGAMENTO */}
        {order.log_pagamento && <section className="border border-gray-200 rounded">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Informações de Pagamento e Auditoria</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Informações Básicas de Pagamento */}
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Método de Pagamento</p>
                  <p className="font-semibold text-gray-900">
                    {order.log_pagamento.method === 'pix' ? 'PIX' : order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status do Pagamento</p>
                  <p className="font-semibold text-gray-900">
                    {order.log_pagamento.payment_status === 'approved' ? 'Aprovado' : order.log_pagamento.payment_status === 'pending' ? 'Pendente' : order.log_pagamento.payment_status || 'N/A'}
                  </p>
                </div>
                {order.log_pagamento.pixData?.paymentId && <div>
                    <p className="text-gray-500 mb-1">ID da Transação</p>
                    <p className="font-mono text-xs font-semibold text-gray-900">
                      {order.log_pagamento.pixData.paymentId}
                    </p>
                  </div>}
              </div>

              {/* Informações Detalhadas do PIX */}
              {order.log_pagamento.method === 'pix' && order.log_pagamento.pixData && <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Detalhes do PIX
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs bg-blue-50 p-3 rounded">
                    {order.log_pagamento.pixData.createdAt && <div>
                        <p className="text-gray-500 mb-1">Data de Criação</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(order.log_pagamento.pixData.createdAt)}
                        </p>
                      </div>}
                    {order.log_pagamento.pixData.approvedAt && <div>
                        <p className="text-gray-500 mb-1">Data de Aprovação</p>
                        <p className="font-semibold text-green-700">
                          {formatDate(order.log_pagamento.pixData.approvedAt)}
                        </p>
                      </div>}
                    {order.log_pagamento.pixData.transactionAmount && <div>
                        <p className="text-gray-500 mb-1">Valor da Transação</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(order.log_pagamento.pixData.transactionAmount)}
                        </p>
                      </div>}
                    {order.log_pagamento.pixData.mpResponse?.status && <div>
                        <p className="text-gray-500 mb-1">Status Mercado Pago</p>
                        <p className={`font-semibold capitalize inline-flex items-center gap-1 ${order.log_pagamento.pixData.mpResponse.status === 'approved' ? 'text-green-700' : order.log_pagamento.pixData.mpResponse.status === 'pending' ? 'text-yellow-700' : 'text-gray-900'}`}>
                          {order.log_pagamento.pixData.mpResponse.status === 'pending' ? <>⏳ Pendente</> : order.log_pagamento.pixData.mpResponse.status === 'approved' ? <>✅ Aprovado</> : order.log_pagamento.pixData.mpResponse.status}
                        </p>
                      </div>}
                  </div>
                  
                  {/* Alerta de dados incompletos */}
                  {hasIncompleteAuditData && <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                            Dados de Auditoria Incompletos
                          </h4>
                          <p className="text-xs text-yellow-700 mb-3">
                            Este pedido foi criado antes da implementação do sistema de auditoria completo. 
                            Clique no botão abaixo para buscar e atualizar os dados do Mercado Pago.
                          </p>
                          <Button size="sm" onClick={() => fixOrderAuditData(order.id)} disabled={isFixing} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            {isFixing ? <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Atualizando...
                              </> : <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Atualizar Dados de Auditoria
                              </>}
                          </Button>
                        </div>
                      </div>
                    </div>}
                </div>}

              {/* 🔐 AUDITORIA FINANCEIRA COMPLETA */}
              {order.compliance_data && Object.keys(order.compliance_data).length > 0}

              {/* Dados de Compliance Antigos (fallback) */}
              {order.compliance_data && !order.compliance_data.payer && order.compliance_data.payment_method_id && <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Dados de Compliance (Formato Antigo)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs bg-green-50 p-3 rounded">
                    {order.compliance_data.payment_method_id && <div>
                        <p className="text-gray-500 mb-1">Forma de Pagamento</p>
                        <p className="font-semibold text-gray-900 uppercase">
                          {order.compliance_data.payment_method_id}
                        </p>
                      </div>}
                    {order.compliance_data.transaction_amount && <div>
                        <p className="text-gray-500 mb-1">Valor Transacionado</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(order.compliance_data.transaction_amount)}
                        </p>
                      </div>}
                  </div>
                </div>}

              {/* Auditoria - IP e Device */}
              {(order.ip_origem || order.device_info) && <div className="border-t pt-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Dados de Auditoria
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded">
                    {order.ip_origem && <div>
                        <p className="text-gray-500 mb-1">IP de Origem</p>
                        <p className="font-mono font-semibold text-gray-900">{order.ip_origem}</p>
                      </div>}
                    {order.device_info && <>
                        <div>
                          <p className="text-gray-500 mb-1">Dispositivo</p>
                          <p className="font-semibold text-gray-900">{order.device_info.deviceType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Sistema Operacional</p>
                          <p className="font-semibold text-gray-900">{order.device_info.os || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Navegador</p>
                          <p className="font-semibold text-gray-900">{order.device_info.browser || 'N/A'}</p>
                        </div>
                      </>}
                  </div>
                </div>}
            </div>
          </section>}

        {/* SEÇÃO: LOCAIS CONTRATADOS */}
        {panels && panels.length > 0 ? <section className="border border-border rounded-xl overflow-hidden">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <button className="w-full bg-muted/50 px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-muted/80 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Prédios Contratados</h2>
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {panels.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setShowAddBuildingDialog(true); }}
                      className="h-7 px-2 text-xs border-green-500 text-green-700 hover:bg-green-50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="divide-y divide-border">
                  {panels.map((panel, index) => (
                    <div key={panel.id} className={`flex items-center gap-4 px-5 py-3 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'} hover:bg-accent/50 transition-colors`}>
                      <div className="w-8 h-8 rounded-lg bg-primary/5 border border-border flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-mono font-bold text-primary">#{panel.id.substring(0, 4)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{panel.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{panel.endereco}</p>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:inline-block">
                        {panel.bairro}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          setRemovingBuildingId(panel.id);
                          const success = await removeBuilding(order.id, panel.id);
                          setRemovingBuildingId(null);
                          if (success && onBuildingChanged) onBuildingChanged();
                        }}
                        disabled={removingBuildingId === panel.id}
                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 flex-shrink-0"
                      >
                        {removingBuildingId === panel.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </section> : <section className="border border-red-200 rounded bg-red-50">
            <div className="bg-red-100 px-4 py-2 border-b border-red-200">
              <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide flex items-center gap-2">
                <span>⚠️</span> Prédios Contratados
              </h2>
            </div>
            <div className="p-8 text-center">
              <MapPin className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-700 mb-1">Nenhum prédio válido encontrado</p>
              <p className="text-xs text-red-600 mb-2">
                Este pedido tem IDs de prédios registrados, mas eles não existem mais no sistema.
              </p>
              {order.lista_predios && order.lista_predios.length > 0 && <div className="mt-3 p-3 bg-white rounded border border-red-200 max-w-md mx-auto">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">IDs registrados no pedido:</p>
                  <div className="space-y-1">
                    {order.lista_predios.map((id: string) => <p key={id} className="text-xs font-mono text-gray-700">
                        • {id}
                      </p>)}
                  </div>
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    ⚠️ Estes prédios podem ter sido removidos do sistema
                  </p>
                </div>}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddBuildingDialog(true)}
                className="mt-3 border-green-500 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Prédio
              </Button>
            </div>
          </section>}

        {/* SEÇÃO: VÍDEOS ENVIADOS COM PREVIEW */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Relatório de Vídeos</h2>
            {videos.length > 0 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
              </span>}
          </div>
          
          {videos.length === 0 ? <div className="p-8 text-center">
              <Video className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Nenhum vídeo enviado</p>
              <p className="text-xs text-gray-500">Os vídeos aparecerão aqui quando forem enviados.</p>
            </div> : <div className="p-4 space-y-4">
              {sortedVideos.map((video, videoIndex) => {
            const isInDisplay = video.video_data?.id === currentVideoId;
            return <div key={video.id} className={`border rounded-lg overflow-hidden transition-all ${isInDisplay ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:shadow-md'}`}>
                    {isInDisplay && <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 text-xs font-bold flex items-center gap-2">
                        <div className="relative flex items-center">
                          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                          <div className="relative w-2 h-2 bg-white rounded-full" />
                        </div>
                        🔴 EM EXIBIÇÃO AGORA
                      </div>}
                    <div className="grid grid-cols-12 gap-4">
                      {/* Preview do Vídeo */}
                      <div className="col-span-3">
                        <div className="aspect-video bg-gray-900 relative group">
                          {video.video_data?.url ? <>
                              <video src={video.video_data.url} className="w-full h-full object-contain" autoPlay muted loop playsInline preload="metadata" />
                              <div className="absolute top-2 left-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${isInDisplay ? 'bg-blue-600 text-white' : 'bg-black/80 text-white'}`}>
                                  Slot {video.slot_position}
                                </span>
                              </div>
                            </> : <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Video className="h-8 w-8" />
                            </div>}
                        </div>
                      </div>
                      
                      {/* Informações do Vídeo */}
                      <div className="col-span-9 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className={`font-semibold text-base mb-1 ${isInDisplay ? 'text-blue-900' : 'text-gray-900'}`}>
                              {video.video_data?.nome || 'Nome não disponível'}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>{video.video_data?.duracao != null ? `${video.video_data.duracao}s` : 'N/A'}</span>
                              <span>•</span>
                              <span className="capitalize">{video.video_data?.orientacao || 'N/A'}</span>
                              <span>•</span>
                              <span>
                                Enviado em {video.uploaded_at ? formatDate(video.uploaded_at) : video.created_at ? formatDate(video.created_at) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badges e Botão de Resync */}
                          <div className="flex items-center gap-2">
                            {video.approval_status === 'approved' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                Aprovado
                              </span>}
                            {video.approval_status === 'rejected' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">
                                <XCircle className="h-3 w-3" />
                                Rejeitado
                              </span>}
                            {video.approval_status === 'pending' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold">
                                <Clock className="h-3 w-3" />
                                Pendente
                              </span>}
                            
                            
                          </div>
                        </div>
                        
                        {/* Status de Exibição */}
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${video.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-xs text-gray-600">
                              {video.is_active ? <span className="font-semibold text-green-700">Ativo</span> : <span className="text-gray-500">Inativo</span>}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isInDisplay ? <>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                                  <div className="relative w-2 h-2 bg-blue-500 rounded-full" />
                                </div>
                                <span className="text-xs font-bold text-blue-700">EM EXIBIÇÃO</span>
                              </> : <>
                                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                                <span className="text-xs text-gray-500">Na lista de programação</span>
                              </>}
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-gray-500">Slot</span>
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${isInDisplay ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}>
                              {video.slot_position}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>;
          })}
            </div>}
        </section>
      </div>

      {/* FOOTER MINIMALISTA */}
      <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 mt-6">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-900">EXA - Publicidade Inteligente</p>
            <p>www.examidia.com.br</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Documento gerado eletronicamente</p>
            <p className="font-medium text-gray-700">{emittedAt}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Dialog de Gestão de Prédios */}
    <BuildingManagementDialog
      isOpen={showAddBuildingDialog}
      onClose={() => setShowAddBuildingDialog(false)}
      onConfirm={async (buildingIds) => {
        const success = await addBuildings(order.id, buildingIds);
        if (success) window.location.reload();
      }}
      existingBuildingIds={order.lista_predios || []}
      loading={buildingsLoading}
    />
    </>;
};