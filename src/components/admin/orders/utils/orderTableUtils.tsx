import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, XCircle, Play, FileText, Video, Lock } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';
import { getStatusConfig, PedidoStatusCanonical } from '@/constants/pedidoStatus';

// Mapeamento de ícones Lucide para status canônicos
const getStatusIcon = (status: string) => {
  const icons: Record<string, React.ReactNode> = {
    pendente: <Clock className="h-3 w-3 mr-1" />,
    aguardando_contrato: <FileText className="h-3 w-3 mr-1" />,
    aguardando_video: <Video className="h-3 w-3 mr-1" />,
    video_enviado: <Video className="h-3 w-3 mr-1" />,
    video_aprovado: <CheckCircle className="h-3 w-3 mr-1" />,
    ativo: <Play className="h-3 w-3 mr-1" />,
    finalizado: <CheckCircle className="h-3 w-3 mr-1" />,
    cancelado: <XCircle className="h-3 w-3 mr-1" />,
    cancelado_automaticamente: <Clock className="h-3 w-3 mr-1" />,
    bloqueado: <Lock className="h-3 w-3 mr-1" />
  };
  return icons[status] || <AlertTriangle className="h-3 w-3 mr-1" />;
};

export const getStatusBadge = (item: OrderOrAttempt) => {
  // Tentativas têm badge especial
  if (item.type === 'attempt') {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Tentativa
      </Badge>
    );
  }

  // Usa o mapper central canônico
  const config = getStatusConfig(item.status);
  
  return (
    <Badge className={config.className}>
      {getStatusIcon(item.status)}
      {config.label}
    </Badge>
  );
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getClientName = (item: OrderOrAttempt) => {
  return item.client_name || 'Nome não disponível';
};

export const getClientEmail = (item: OrderOrAttempt) => {
  return item.client_email || 'Email não encontrado';
};

export const getPanelsCount = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return `${item.predios_selecionados?.length || 0} painéis`;
  }
  return `${item.lista_paineis?.length || 0} painéis`;
};

export const getPlanDuration = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return '1 mês (est.)';
  }
  return `${item.plano_meses || 1} meses`;
};

export const getPeriod = (item: OrderOrAttempt) => {
  if (item.type === 'attempt' || !item.data_inicio) {
    return 'Não definido';
  }
  
  const startDate = formatDate(item.data_inicio);
  const endDate = item.data_fim ? formatDate(item.data_fim) : 'N/A';
  return `${startDate} - ${endDate}`;
};

export const getTypeBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Tentativa
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="border-green-500 text-green-700">
      <CheckCircle className="h-3 w-3 mr-1" />
      Pedido
    </Badge>
  );
};
