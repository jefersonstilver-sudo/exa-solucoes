
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { OrderOrAttempt } from '@/types/ordersAndAttempts';

export const getStatusBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Tentativa
      </Badge>
    );
  }

  const status = item.status.toLowerCase();
  switch (status) {
    case 'pendente':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    case 'pago':
    case 'pago_pendente_video':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    case 'video_enviado':
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          <Clock className="h-3 w-3 mr-1" />
          Vídeo Enviado
        </Badge>
      );
    case 'video_aprovado':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    case 'ativo':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    case 'video_rejeitado':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      );
    case 'cancelado':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      );
    case 'expirado':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
          <Clock className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status || 'Desconhecido'}
        </Badge>
      );
  }
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
  // CORREÇÃO: Usar lista_paineis em vez de predios_selecionados
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
