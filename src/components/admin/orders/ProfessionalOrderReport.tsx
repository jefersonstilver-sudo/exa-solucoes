import React from 'react';
import { Calendar, User, Mail, CreditCard, MapPin, Video, CheckCircle2, XCircle, Clock, FileText, TrendingUp, Shield } from 'lucide-react';
import exaLogo from '@/assets/exa-logo.png';

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
  cupom_id?: string;
  termos_aceitos?: boolean;
  lista_predios?: string[];
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
}

export const ProfessionalOrderReport: React.FC<ProfessionalOrderReportProps> = ({
  order,
  panels,
  videos
}) => {
  console.log('📋 [PROFESSIONAL REPORT] Renderizando relatório');
  console.log('📋 [PROFESSIONAL REPORT] Panels recebidos:', panels?.length || 0);
  console.log('📋 [PROFESSIONAL REPORT] Panels data:', panels);
  console.log('📋 [PROFESSIONAL REPORT] Videos recebidos:', videos?.length || 0);
  
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
    const configs: Record<string, { bg: string, text: string, label: string, icon: React.ReactNode }> = {
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
      },
    };
    return configs[status] || { bg: 'bg-gray-500', text: 'text-white', label: status, icon: <FileText className="h-4 w-4" /> };
  };

  const statusConfig = getStatusConfig(order.status);
  const emittedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const subtotal = order.valor_total;
  const desconto = order.cupom_id ? subtotal * 0.1 : 0;

  return (
    <div className="w-full max-w-7xl mx-auto bg-white shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER MINIMALISTA PROFISSIONAL */}
      <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] text-white px-6 py-5 border-b-2 border-gray-200">
        <div className="flex justify-between items-center">
          {/* Logo e Info */}
          <div className="flex items-center gap-6">
            <img 
              src={exaLogo} 
              alt="EXA" 
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="border-l border-white/30 pl-6">
              <p className="text-xs text-white/80 mb-0.5">Relatório de Pedido</p>
              <p className="text-sm font-semibold">#{order.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          
          {/* Info Rápida */}
          <div className="flex items-center gap-6 text-xs">
            <div>
              <p className="text-white/70">Cliente</p>
              <p className="font-semibold">{order.client_name}</p>
            </div>
            <div>
              <p className="text-white/70">Valor</p>
              <p className="font-semibold">{formatCurrency(order.valor_total)}</p>
            </div>
            <div className={`${statusConfig.bg} ${statusConfig.text} px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5`}>
              {statusConfig.icon}
              {statusConfig.label}
            </div>
            <div className="text-white/70 text-right">
              <p className="text-[10px]">Emitido em</p>
              <p className="font-medium">{emittedAt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL - MINIMALISTA */}
      <div className="px-6 py-6 space-y-6">
        
        {/* SEÇÃO: INFORMAÇÕES DO PEDIDO */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Informações do Pedido</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-4 gap-4 text-xs">
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
            <div className="grid grid-cols-3 gap-4 text-xs">
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
                  {order.termos_aceitos ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700">
                      <XCircle className="h-3 w-3" />
                      Não
                    </span>
                  )}
                </p>
              </div>
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
              
              {desconto > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Desconto
                  </span>
                  <span className="font-semibold">-{formatCurrency(desconto)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="text-lg font-black text-gray-900">{formatCurrency(order.valor_total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: INFORMAÇÕES DE PAGAMENTO */}
        {order.log_pagamento && (
          <section className="border border-gray-200 rounded">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Informações de Pagamento</h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Método de Pagamento</p>
                  <p className="font-semibold text-gray-900">
                    {order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.log_pagamento.payment_status || 'N/A'}
                  </p>
                </div>
                {order.log_pagamento.processed_at && (
                  <div>
                    <p className="text-gray-500 mb-1">Processado em</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(order.log_pagamento.processed_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SEÇÃO: LOCAIS CONTRATADOS */}
        {panels && panels.length > 0 ? (
          <section className="border border-gray-200 rounded">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Prédios Contratados</h2>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                {panels.length} {panels.length === 1 ? 'prédio' : 'prédios'}
              </span>
            </div>
            
            <div className="overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Nome do Prédio</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Endereço</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Bairro</th>
                  </tr>
                </thead>
                <tbody>
                  {panels.map((panel, index) => (
                    <tr 
                      key={panel.id}
                      className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-2">
                        <span className="font-mono text-blue-600 font-semibold">#{panel.id.substring(0, 8)}</span>
                      </td>
                      <td className="px-4 py-2 font-semibold text-gray-900">{panel.nome}</td>
                      <td className="px-4 py-2 text-gray-700">{panel.endereco}</td>
                      <td className="px-4 py-2 text-gray-700">{panel.bairro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="border border-red-200 rounded bg-red-50">
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
              {order.lista_predios && order.lista_predios.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded border border-red-200 max-w-md mx-auto">
                  <p className="text-xs text-gray-600 mb-1 font-semibold">IDs registrados no pedido:</p>
                  <div className="space-y-1">
                    {order.lista_predios.map((id: string) => (
                      <p key={id} className="text-xs font-mono text-gray-700">
                        • {id}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-2 font-semibold">
                    ⚠️ Estes prédios podem ter sido removidos do sistema
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SEÇÃO: VÍDEOS ENVIADOS COM PREVIEW */}
        <section className="border border-gray-200 rounded">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Relatório de Vídeos</h2>
            {videos.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
              </span>
            )}
          </div>
          
          {videos.length === 0 ? (
            <div className="p-8 text-center">
              <Video className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 mb-1">Nenhum vídeo enviado</p>
              <p className="text-xs text-gray-500">Os vídeos aparecerão aqui quando forem enviados.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {sortedVideos.map((video, videoIndex) => {
                const isInDisplay = video.selected_for_display;
                return (
                  <div 
                    key={video.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isInDisplay 
                        ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200' 
                        : 'bg-white border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {isInDisplay && (
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 text-xs font-bold flex items-center gap-2">
                        <div className="relative flex items-center">
                          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                          <div className="relative w-2 h-2 bg-white rounded-full" />
                        </div>
                        🔴 EM EXIBIÇÃO AGORA
                      </div>
                    )}
                    <div className="grid grid-cols-12 gap-4">
                      {/* Preview do Vídeo */}
                      <div className="col-span-3">
                        <div className="aspect-video bg-gray-900 relative group">
                          {video.video_data?.url ? (
                            <>
                              <video 
                                src={video.video_data.url} 
                                className="w-full h-full object-contain"
                                controls
                                preload="metadata"
                              />
                              <div className="absolute top-2 left-2">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  isInDisplay 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-black/80 text-white'
                                }`}>
                                  Slot {video.slot_position}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Video className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Informações do Vídeo */}
                      <div className="col-span-9 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className={`font-semibold text-base mb-1 ${
                              isInDisplay ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {video.video_data?.nome || 'Nome não disponível'}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>{video.video_data?.duracao != null ? `${video.video_data.duracao}s` : 'N/A'}</span>
                              <span>•</span>
                              <span className="capitalize">{video.video_data?.orientacao || 'N/A'}</span>
                              <span>•</span>
                              <span>
                                Enviado em {video.uploaded_at ? formatDate(video.uploaded_at) : 
                                video.created_at ? formatDate(video.created_at) : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Badges */}
                          <div className="flex items-center gap-2">
                            {video.approval_status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                                <CheckCircle2 className="h-3 w-3" />
                                Aprovado
                              </span>
                            )}
                            {video.approval_status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold">
                                <XCircle className="h-3 w-3" />
                                Rejeitado
                              </span>
                            )}
                            {video.approval_status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-semibold">
                                <Clock className="h-3 w-3" />
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Status de Exibição */}
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${video.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-xs text-gray-600">
                              {video.is_active ? (
                                <span className="font-semibold text-green-700">Ativo</span>
                              ) : (
                                <span className="text-gray-500">Inativo</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isInDisplay ? (
                              <>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                                  <div className="relative w-2 h-2 bg-blue-500 rounded-full" />
                                </div>
                                <span className="text-xs font-bold text-blue-700">EM EXIBIÇÃO</span>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-gray-300 rounded-full" />
                                <span className="text-xs text-gray-500">Na lista de programação</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-xs text-gray-500">Slot</span>
                            <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded ${
                              isInDisplay 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-white'
                            }`}>
                              {video.slot_position}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  );
};