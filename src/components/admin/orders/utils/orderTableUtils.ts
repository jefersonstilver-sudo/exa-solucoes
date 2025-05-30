
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';

export const getStatusBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return <Badge className="bg-orange-600 text-white text-xs px-2 py-1 font-semibold border-0">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Tentativa Abandonada
    </Badge>;
  }

  const status = item.status;
  switch (status) {
    case 'pago_pendente_video':
      return <Badge className="bg-orange-600 text-white text-xs px-2 py-1 font-semibold border-0">Aguardando Vídeo</Badge>;
    case 'video_enviado':
      return <Badge className="bg-blue-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Enviado</Badge>;
    case 'video_aprovado':
      return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Aprovado</Badge>;
    case 'video_rejeitado':
      return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">Vídeo Rejeitado</Badge>;
    case 'pago':
      return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Pago</Badge>;
    case 'pendente':
      return <Badge className="bg-gray-700 text-white text-xs px-2 py-1 font-semibold border-0">Pendente</Badge>;
    case 'ativo':
      return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">Ativo</Badge>;
    case 'cancelado':
      return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">Cancelado</Badge>;
    default:
      return <Badge className="bg-gray-700 text-white text-xs px-2 py-1 font-semibold border-0">{status}</Badge>;
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const getClientName = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return item.client_name || 'Nome não disponível';
  }
  return item.client_name;
};

export const getClientEmail = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return item.client_email || 'Email não encontrado';
  }
  return item.client_email;
};

export const getPanelsCount = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return item.predios_selecionados?.length || 0;
  }
  return item.lista_paineis?.length || 0;
};

export const getPlanDuration = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return '1 mês (estimado)';
  }
  return `${item.plano_meses} ${item.plano_meses === 1 ? 'mês' : 'meses'}`;
};

export const getPeriod = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return 'Não definido';
  }
  return `${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}`;
};

export const getTypeBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return <Badge variant="outline" className="border-orange-500 text-orange-700">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Tentativa
    </Badge>;
  } else {
    return <Badge variant="outline" className="border-green-500 text-green-700">
      <DollarSign className="h-3 w-3 mr-1" />
      Pedido
    </Badge>;
  }
};
