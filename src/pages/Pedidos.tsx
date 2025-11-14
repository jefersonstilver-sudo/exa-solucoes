
import { useUserOrdersAndAttempts } from '@/hooks/useUserOrdersAndAttempts';
import { useUserSession } from '@/hooks/useUserSession';
import { useAttemptFinalizer } from '@/hooks/useAttemptFinalizer';
import { useOrderExistsForAttempt } from '@/hooks/useOrderExistsForAttempt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Video, DollarSign, ExternalLink, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { CortesiaOrderSuccessModal } from '@/components/orders/CortesiaOrderSuccessModal';
import { useCortesiaSuccessDetection } from '@/hooks/useCortesiaSuccessDetection';

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'pendente': 'bg-yellow-100 text-yellow-800',
    'pago': 'bg-green-100 text-green-800',
    'pago_pendente_video': 'bg-blue-100 text-blue-800',
    'video_enviado': 'bg-purple-100 text-purple-800',
    'video_aprovado': 'bg-green-100 text-green-800',
    'ativo': 'bg-emerald-100 text-emerald-800', // REMOVIDO - não usado mais
    'cancelado': 'bg-red-100 text-red-800',
    'tentativa': 'bg-gray-100 text-gray-800'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'pago': 'Pago',
    'pago_pendente_video': 'Pago - Aguardando Vídeo',
    'video_enviado': 'Vídeo Enviado',
    'video_aprovado': 'EM EXIBIÇÃO',
    'ativo': 'REMOVIDO - Usar video_aprovado', // REMOVIDO - não usado mais
    'cancelado': 'Cancelado',
    'tentativa': 'Tentativa'
  };
  return statusMap[status] || status;
};

interface AttemptCardProps {
  attempt: any;
  onFinalize: (attemptId: string) => void;
  isProcessing: boolean;
}

const AttemptCard = ({ attempt, onFinalize, isProcessing }: AttemptCardProps) => {
  const orderCheck = useOrderExistsForAttempt(attempt.id);
  const navigate = useNavigate();

  const handleAction = () => {
    if (orderCheck.exists && orderCheck.pedidoId) {
      // Redirecionar para pagamento do pedido existente
      navigate(`/payment?pedido=${orderCheck.pedidoId}&method=pix`);
    } else {
      // Finalizar tentativa criando novo pedido
      onFinalize(attempt.id);
    }
  };

  const getButtonText = () => {
    if (orderCheck.loading) return 'Verificando...';
    if (orderCheck.exists) return 'Ir para Pagamento';
    return 'Finalizar Compra';
  };

  const getButtonIcon = () => {
    if (orderCheck.exists) return <ExternalLink className="w-4 h-4" />;
    return <ShoppingCart className="w-4 h-4" />;
  };

  return (
    <Card key={attempt.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Tentativa de Compra</CardTitle>
            <CardDescription>
              {format(new Date(attempt.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(attempt.status)}>
            {getStatusText(attempt.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <span className="font-semibold">{formatCurrency(attempt.valor_total)}</span>
        </div>
        
        {attempt.predios_selecionados && attempt.predios_selecionados.length > 0 && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <span className="text-sm text-gray-600">
                {attempt.predios_selecionados.length} prédio(s) selecionado(s)
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleAction}
            disabled={isProcessing || orderCheck.loading}
            className="flex-1"
          >
            {getButtonIcon()}
            {getButtonText()}
          </Button>
        </div>

        {orderCheck.exists && orderCheck.pedidoId && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            ℹ️ Já existe um pedido criado para esta tentativa (ID: {orderCheck.pedidoId.substring(0, 8)}...)
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Pedidos() {
  const { user } = useUserSession();
  const { userOrdersAndAttempts, loading } = useUserOrdersAndAttempts(user?.id);
  const { finalizeAttemptToOrder, isProcessing } = useAttemptFinalizer();
  
  // Detect cortesia order success
  const orders = userOrdersAndAttempts?.filter(item => item.type === 'order');
  const { showModal, orderData, closeModal } = useCortesiaSuccessDetection(orders, loading);

  console.log('📋 [PEDIDOS PAGE] Render state:', {
    loading,
    ordersCount: orders?.length,
    showModal,
    hasOrderData: !!orderData
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando seus pedidos...</div>
      </div>
    );
  }

  if (!userOrdersAndAttempts || userOrdersAndAttempts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
        <div className="text-center py-8 text-gray-500">
          Você ainda não possui pedidos ou tentativas de compra.
        </div>
      </div>
    );
  }

  const attempts = userOrdersAndAttempts.filter(item => item.type === 'attempt');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
      
      {/* Cortesia Success Modal */}
      <CortesiaOrderSuccessModal
        isOpen={showModal}
        pedidoId={orderData?.id || ''}
        buildingName={orderData?.selected_buildings?.[0]?.nome || orderData?.nomes_predios?.[0]}
        buildingAddress={orderData?.selected_buildings?.[0]?.endereco}
        panelCount={orderData?.lista_paineis?.length || orderData?.selected_buildings?.length || 1}
        onClose={closeModal}
      />
      
      <div className="space-y-6">
        {/* Pedidos Completos */}
        {orders && orders.map((order) => (
          <Card key={order.id} className="mb-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id.substring(0, 8)}</CardTitle>
                  <CardDescription>
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">{formatCurrency(order.valor_total)}</span>
                </div>
                
                {order.plano_meses && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{order.plano_meses} meses</span>
                  </div>
                )}
              </div>

              {order.data_inicio && order.data_fim && (
                <div className="text-sm text-gray-600">
                  <strong>Período:</strong> {' '}
                  {format(new Date(order.data_inicio), 'dd/MM/yyyy', { locale: ptBR })} até {' '}
                  {format(new Date(order.data_fim), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}

              {order.lista_paineis && order.lista_paineis.length > 0 && (
                <div className="text-sm text-gray-600">
                  <strong>Painéis:</strong> {order.lista_paineis.length} painel(is) selecionado(s)
                </div>
              )}

              {order.videos && order.videos.length > 0 && (
                <div>
                  <Separator className="my-2" />
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="w-4 h-4" />
                    <span>{order.videos.length} vídeo(s) associado(s)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Tentativas de Compra */}
        {attempts.length > 0 && (
          <>
            <Separator className="my-6" />
            <h2 className="text-xl font-semibold mb-4">Tentativas de Compra</h2>
            {attempts.map((attempt) => (
              <AttemptCard
                key={attempt.id}
                attempt={attempt}
                onFinalize={finalizeAttemptToOrder}
                isProcessing={isProcessing}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
