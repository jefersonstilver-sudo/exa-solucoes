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
    nome: string;
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
    <div className="w-full max-w-7xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
      {/* HEADER PROFISSIONAL - Gradiente EXA com informações principais */}
      <div className="bg-gradient-to-r from-[#3C1361] to-[#6B21A8] text-white px-8 py-10 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            {/* Logo e branding */}
            <div>
              <img 
                src={exaLogo} 
                alt="EXA" 
                className="h-16 w-auto mb-2 brightness-0 invert"
              />
              <p className="text-purple-200 text-sm font-medium">Publicidade Inteligente</p>
            </div>
            
            {/* Data de emissão */}
            <div className="text-right">
              <p className="text-xs text-purple-200 mb-1">Relatório Detalhado do Pedido</p>
              <p className="text-sm font-medium flex items-center justify-end gap-2">
                <Calendar className="h-4 w-4" />
                Emitido em: {emittedAt}
              </p>
            </div>
          </div>

          {/* Informações principais do pedido */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-xs text-purple-200 mb-1">ID do Pedido</p>
              <p className="text-lg font-bold">#{order.id.substring(0, 8).toUpperCase()}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-xs text-purple-200 mb-1">Cliente</p>
              <p className="text-lg font-bold truncate">{order.client_name}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-xs text-purple-200 mb-1">Valor Total</p>
              <p className="text-lg font-bold">{formatCurrency(order.valor_total)}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-xs text-purple-200 mb-1">Status</p>
              <div className={`inline-flex items-center gap-2 ${statusConfig.bg} ${statusConfig.text} px-3 py-1 rounded-full text-sm font-semibold`}>
                {statusConfig.icon}
                {statusConfig.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="px-8 py-8 space-y-8">
        
        {/* SEÇÃO: INFORMAÇÕES DO PEDIDO */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
            <div className="bg-[#3C1361] p-2 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Informações do Pedido</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-[#3C1361]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Data de Criação</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Plano Contratado</p>
                  <p className="text-lg font-bold text-gray-900">
                    {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Período de Vigência</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Início</p>
                      <p className="text-base font-bold text-gray-900">{formatSimpleDate(order.data_inicio)}</p>
                    </div>
                    <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                    <div>
                      <p className="text-xs text-gray-500">Término</p>
                      <p className="text-base font-bold text-gray-900">{formatSimpleDate(order.data_fim)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: DADOS DO CLIENTE */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
            <div className="bg-[#3C1361] p-2 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Dados do Cliente</h2>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Nome Completo</p>
                </div>
                <p className="text-xl font-bold text-gray-900 ml-8">{order.client_name}</p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">E-mail</p>
                </div>
                <p className="text-xl font-bold text-gray-900 ml-8">{order.client_email}</p>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-600">Termos e Condições</p>
                </div>
                <div className="ml-8">
                  {order.termos_aceitos ? (
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Aceitos em {formatDate(order.created_at)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                      <XCircle className="h-4 w-4" />
                      Não aceitos
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: RESUMO FINANCEIRO */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
            <div className="bg-[#3C1361] p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Resumo Financeiro</h2>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 rounded-xl border-2 border-[#3C1361] shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(subtotal + desconto)}</span>
              </div>
              
              {desconto > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Desconto Aplicado
                  </span>
                  <span className="text-xl font-bold text-green-600">-{formatCurrency(desconto)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 bg-gradient-to-r from-[#3C1361] to-[#6B21A8] -mx-8 -mb-8 px-8 py-6 rounded-b-xl">
                <span className="text-white text-lg font-bold">VALOR TOTAL</span>
                <span className="text-3xl font-black text-white">{formatCurrency(order.valor_total)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO: INFORMAÇÕES DE PAGAMENTO */}
        {order.log_pagamento && (
          <section>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
              <div className="bg-[#3C1361] p-2 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Informações de Pagamento</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">Método de Pagamento</p>
                <p className="text-xl font-bold text-gray-900">
                  {order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100 shadow-sm">
                <p className="text-sm font-medium text-gray-600 mb-2">Status do Pagamento</p>
                <p className="text-xl font-bold text-gray-900 capitalize">
                  {order.log_pagamento.payment_status || 'N/A'}
                </p>
              </div>

              {order.log_pagamento.processed_at && (
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-2">Processado em</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatDate(order.log_pagamento.processed_at)}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SEÇÃO: LOCAIS CONTRATADOS */}
        {panels.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
              <div className="bg-[#3C1361] p-2 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Locais Contratados</h2>
              <span className="bg-[#3C1361] text-white px-3 py-1 rounded-full text-sm font-bold">
                {panels.length} {panels.length === 1 ? 'local' : 'locais'}
              </span>
            </div>
            
            <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3C1361] to-[#6B21A8] text-white">
                    <th className="px-6 py-4 text-left text-sm font-bold">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Nome do Local</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Endereço</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Bairro</th>
                  </tr>
                </thead>
                <tbody>
                  {panels.map((panel, index) => (
                    <tr 
                      key={panel.id}
                      className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-gray-600">
                          #{panel.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{panel.nome}</td>
                      <td className="px-6 py-4 text-gray-700">{panel.endereco}</td>
                      <td className="px-6 py-4 text-gray-700">{panel.bairro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SEÇÃO: VÍDEOS ENVIADOS */}
        <section>
          <div className="flex items-center gap-3 mb-6 pb-3 border-b-4 border-[#3C1361]">
            <div className="bg-[#3C1361] p-2 rounded-lg">
              <Video className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Relatório de Vídeos</h2>
            {videos.length > 0 && (
              <span className="bg-[#3C1361] text-white px-3 py-1 rounded-full text-sm font-bold">
                {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
              </span>
            )}
          </div>
          
          {videos.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-white p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600 mb-2">Nenhum vídeo enviado</p>
              <p className="text-gray-500">Os vídeos enviados pelo cliente aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border-2 border-gray-200 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#3C1361] to-[#6B21A8] text-white">
                    <th className="px-6 py-4 text-left text-sm font-bold">Slot</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Nome do Vídeo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Enviado em</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Duração</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Orientação</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Ativo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Exibição</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video, index) => (
                    <tr 
                      key={video.id}
                      className={`border-b border-gray-200 hover:bg-purple-50 transition-colors ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-[#3C1361] text-white font-bold rounded-lg">
                          {video.slot_position}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {video.video_data?.nome || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">
                        {video.uploaded_at ? formatDate(video.uploaded_at) : 
                         video.created_at ? formatDate(video.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {video.video_data?.duracao != null ? `${video.video_data.duracao}s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-700 capitalize">
                        {video.video_data?.orientacao || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {video.approval_status === 'approved' && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Aprovado
                          </span>
                        )}
                        {video.approval_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <XCircle className="h-3 w-3" />
                            Rejeitado
                          </span>
                        )}
                        {video.approval_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <Clock className="h-3 w-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {video.is_active ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <XCircle className="h-3 w-3" />
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {video.selected_for_display ? (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Sim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                            Não
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* FOOTER PROFISSIONAL */}
      <div className="bg-gray-900 text-white px-8 py-8 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="font-bold text-lg mb-1">EXA - Publicidade Inteligente</p>
            <p className="text-sm text-gray-400">contato@exa.com.br | www.exa.com.br</p>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-400 mb-1">Documento gerado eletronicamente</p>
            <p className="text-sm font-medium">{emittedAt}</p>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            Este documento contém informações confidenciais e é destinado exclusivamente ao cliente mencionado.
          </p>
        </div>
      </div>
    </div>
  );
};