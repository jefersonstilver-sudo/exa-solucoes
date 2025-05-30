
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, DollarSign, Clock, CheckCircle, XCircle, Loader, Play } from 'lucide-react';
import { OrderOrAttempt } from '@/hooks/useOrdersWithAttempts';

export const getStatusBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Tentativa Abandonada
    </Badge>;
  }

  const status = item.status;
  switch (status) {
    case 'pendente':
      return <Badge className="bg-orange-500 text-white text-xs px-2 py-1 font-semibold border-0">
        <Clock className="h-3 w-3 mr-1" />
        Aguardando Pagamento
      </Badge>;
    case 'pago_pendente_video':
      return <Badge className="bg-yellow-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <Loader className="h-3 w-3 mr-1" />
        Aguardando Vídeo
      </Badge>;
    case 'video_enviado':
      return <Badge className="bg-blue-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <Play className="h-3 w-3 mr-1" />
        Vídeo Enviado
      </Badge>;
    case 'video_aprovado':
      return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <CheckCircle className="h-3 w-3 mr-1" />
        Vídeo Aprovado
      </Badge>;
    case 'video_rejeitado':
      return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <XCircle className="h-3 w-3 mr-1" />
        Vídeo Rejeitado
      </Badge>;
    case 'pago':
      return <Badge className="bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <DollarSign className="h-3 w-3 mr-1" />
        Pago
      </Badge>;
    case 'ativo':
      return <Badge className="bg-green-700 text-white text-xs px-2 py-1 font-semibold border-0">
        <CheckCircle className="h-3 w-3 mr-1" />
        Ativo
      </Badge>;
    case 'cancelado':
      return <Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <XCircle className="h-3 w-3 mr-1" />
        Cancelado
      </Badge>;
    case 'expirado':
      return <Badge className="bg-gray-600 text-white text-xs px-2 py-1 font-semibold border-0">
        <Clock className="h-3 w-3 mr-1" />
        Expirado
      </Badge>;
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
  
  // Para pedidos pendentes, mostrar período estimado
  if (item.status === 'pendente') {
    return 'Aguardando pagamento';
  }
  
  if (!item.data_inicio || !item.data_fim) {
    return 'Datas não definidas';
  }
  
  return `${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}`;
};

export const getTypeBadge = (item: OrderOrAttempt) => {
  if (item.type === 'attempt') {
    return <Badge variant="outline" className="border-red-500 text-red-700">
      <AlertTriangle className="h-3 w-3 mr-1" />
      Tentativa
    </Badge>;
  } else {
    // Cor diferente baseada no status do pedido
    const isPending = item.status === 'pendente';
    return <Badge variant="outline" className={isPending ? "border-orange-500 text-orange-700" : "border-green-500 text-green-700"}>
      {isPending ? <Clock className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
      {isPending ? 'Pendente' : 'Pedido'}
    </Badge>;
  }
};
