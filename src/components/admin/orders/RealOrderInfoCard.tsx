
import React from 'react';
import { Package, Calendar, CreditCard, FileText, Clock, User, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RealOrderInfoCardProps {
  order: {
    id: string;
    status: string;
    created_at: string;
    data_inicio?: string;
    data_fim?: string;
    plano_meses: number;
    log_pagamento?: any;
    compliance_data?: any;
    termos_aceitos?: boolean;
  };
}

export const RealOrderInfoCard: React.FC<RealOrderInfoCardProps> = ({ order }) => {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pago_pendente_video': 'bg-orange-100 text-orange-800 border-orange-200',
      'video_enviado': 'bg-blue-100 text-blue-800 border-blue-200',
      'video_aprovado': 'bg-green-100 text-green-800 border-green-200',
      'video_rejeitado': 'bg-red-100 text-red-800 border-red-200',
      'pago': 'bg-green-100 text-green-800 border-green-200',
      'pendente': 'bg-gray-100 text-gray-800 border-gray-200',
      'ativo': 'bg-green-100 text-green-800 border-green-200',
      'cancelado': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pago_pendente_video': 'Aguardando Vídeo',
      'video_enviado': 'Vídeo Enviado',
      'video_aprovado': 'Vídeo Aprovado',
      'video_rejeitado': 'Vídeo Rejeitado',
      'pago': 'Pago',
      'pendente': 'Pendente',
      'ativo': 'Ativo',
      'cancelado': 'Cancelado'
    };
    
    return labels[status] || status;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethod = () => {
    if (order.log_pagamento?.payment_method) {
      return order.log_pagamento.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito';
    }
    if (order.compliance_data?.payment_method_id) {
      return order.compliance_data.payment_method_id === 'pix' ? 'PIX' : 'Cartão de Crédito';
    }
    return 'N/A';
  };

  const getTransactionId = () => {
    // Buscar primeiro nos dados de compliance
    if (order.compliance_data?.pix_end_to_end_id) {
      return order.compliance_data.pix_end_to_end_id;
    }
    
    // Fallback para log_pagamento
    return order.log_pagamento?.payment_id || 
           order.log_pagamento?.external_reference || 
           'N/A';
  };

  const getPayerInfo = () => {
    if (!order.compliance_data) return null;
    
    const payer = {
      name: `${order.compliance_data.payer_first_name || ''} ${order.compliance_data.payer_last_name || ''}`.trim(),
      email: order.compliance_data.payer_email,
      document: order.compliance_data.payer_identification_number,
      documentType: order.compliance_data.payer_identification_type
    };
    
    return payer.name || payer.email || payer.document ? payer : null;
  };

  const getFinancialInstitution = () => {
    return order.compliance_data?.pix_bank_info || 'N/A';
  };

  const payerInfo = getPayerInfo();

  return (
    <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="border-b border-gray-200 bg-gray-50/50">
        <CardTitle className="text-gray-900 flex items-center">
          <Package className="h-5 w-5 mr-2 text-indexa-purple" />
          Informações do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">Status Atual</p>
          <Badge className={`${getStatusColor(order.status)} border font-medium`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">Data de Criação</p>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <p className="text-gray-900 font-medium">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">Período do Contrato</p>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-gray-900 font-medium">
                {formatDate(order.data_inicio)} - {formatDate(order.data_fim)}
              </p>
              <p className="text-sm text-gray-600">
                ({order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'})
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="bg-gray-200" />
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">Método de Pagamento</p>
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <p className="text-gray-900 font-medium">{getPaymentMethod()}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 font-medium">ID da Transação</p>
          <p className="text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded border break-all">
            {getTransactionId()}
          </p>
        </div>
        
        
        {payerInfo && (
          <>
            <Separator className="bg-gray-200" />
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-indexa-purple" />
                <p className="text-sm text-gray-600 font-medium">Dados de Compliance</p>
              </div>
              
              {payerInfo.name && (
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Nome do Pagador:</span>
                  <span className="text-xs text-gray-900 font-medium">{payerInfo.name}</span>
                </div>
              )}
              
              {payerInfo.document && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {payerInfo.documentType === 'CPF' ? 'CPF' : 'CNPJ'}:
                  </span>
                  <span className="text-xs text-gray-900 font-mono">{payerInfo.document}</span>
                </div>
              )}
              
              {payerInfo.email && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Email do Pagador:</span>
                  <span className="text-xs text-gray-900">{payerInfo.email}</span>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <p className="text-sm text-gray-600 font-medium">Termos Aceitos</p>
          </div>
          <Badge variant={order.termos_aceitos ? "default" : "secondary"} className="text-xs">
            {order.termos_aceitos ? 'Sim' : 'Não'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
