import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileAdvertiserOrders from './MobileAdvertiserOrders';
import { useAuth } from '@/hooks/useAuth';
import { useUserOrdersAndAttempts } from '@/hooks/useUserOrdersAndAttempts';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useAttemptFinalizer } from '@/hooks/useAttemptFinalizer';
import { useCheckoutPro } from '@/hooks/payment/useCheckoutPro';
import { VideoDisplayPopup } from '@/components/video-management/VideoDisplayPopup';
import { Loader2, ShoppingBag, Calendar, Search, Eye, AlertTriangle, CheckCircle, Upload, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CortesiaOrderSuccessModal } from '@/components/orders/CortesiaOrderSuccessModal';
import { useCortesiaSuccessDetection } from '@/hooks/useCortesiaSuccessDetection';
import PixQrCodeDialog from '@/components/checkout/payment/PixQrCodeDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const AdvertiserOrders = () => {
  const {
    userProfile
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    userOrdersAndAttempts,
    loading
  } = useUserOrdersAndAttempts(userProfile?.id);
  const {
    createCheckoutProSession,
    isProcessing: isProcessingCheckout
  } = useCheckoutPro();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [videoDisplayPopup, setVideoDisplayPopup] = useState<{
    isOpen: boolean;
    orderId: string | null;
  }>({
    isOpen: false,
    orderId: null
  });

  // Estado para o popup PIX
  const [pixDialog, setPixDialog] = useState<{
    isOpen: boolean;
    pixData: {
      qrCodeBase64?: string;
      qrCodeText?: string;
      pedidoId?: string;
    } | null;
  }>({
    isOpen: false,
    pixData: null
  });
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const {
    finalizeAttemptToOrder,
    isProcessing: isProcessingAttempt
  } = useAttemptFinalizer();

  // Listen for video display popup events
  useEffect(() => {
    const handleOpenVideoDisplay = (event: CustomEvent) => {
      const {
        orderId
      } = event.detail;
      setVideoDisplayPopup({
        isOpen: true,
        orderId
      });
    };
    window.addEventListener('openVideoDisplay', handleOpenVideoDisplay as EventListener);
    return () => {
      window.removeEventListener('openVideoDisplay', handleOpenVideoDisplay as EventListener);
    };
  }, []);

  // Calcular estatísticas CORRIGIDAS - ANTES do early return para evitar erro de hooks
  const orders = userOrdersAndAttempts.filter(item => item.type === 'order');
  const attempts = userOrdersAndAttempts.filter(item => item.type === 'attempt');

  // Detect cortesia order success - DEVE estar antes do early return
  const {
    showModal,
    orderData,
    closeModal
  } = useCortesiaSuccessDetection(orders, loading);
  console.log('📋 [ADVERTISER ORDERS] Render state:', {
    loading,
    ordersCount: orders?.length,
    showModal,
    hasOrderData: !!orderData,
    isMobile
  });

  // Função para gerar PIX e abrir popup
  const handleGeneratePix = async (orderId: string) => {
    console.log('[AdvertiserOrders] Gerando PIX para pedido:', orderId);
    setIsGeneratingPix(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-pix-for-order', {
        body: {
          pedidoId: orderId
        }
      });
      if (error) throw error;
      if (data?.success && data?.pixData) {
        console.log('✅ PIX gerado com sucesso:', data.pixData);
        setPixDialog({
          isOpen: true,
          pixData: {
            qrCodeBase64: data.pixData.qrCodeBase64,
            qrCodeText: data.pixData.qrCode,
            pedidoId: orderId
          }
        });
      } else {
        throw new Error(data?.error || 'Erro ao gerar PIX');
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar QR Code PIX', {
        description: error.message || 'Tente novamente em instantes'
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Função para processar pagamento com cartão via Mercado Pago
  const handleStripePayment = async (orderId: string) => {
    console.log('[AdvertiserOrders] Processando pagamento com cartão para pedido:', orderId);
    try {
      // Buscar dados do pedido
      const {
        data: pedido,
        error: pedidoError
      } = await supabase.from('pedidos').select('*').eq('id', orderId).single();
      if (pedidoError || !pedido) {
        throw new Error('Pedido não encontrado');
      }

      // Buscar dados dos prédios
      const {
        data: buildings,
        error: buildingsError
      } = await supabase.from('buildings').select('*').in('id', pedido.lista_paineis || []);
      if (buildingsError) {
        throw new Error('Erro ao buscar dados dos prédios');
      }

      // Criar sessão de checkout no Mercado Pago
      const result = await createCheckoutProSession({
        sessionUser: userProfile,
        cartItems: (buildings || []).map(b => ({
          panel: b as any,
          duration: pedido.plano_meses
        })),
        selectedPlan: pedido.plano_meses,
        totalPrice: pedido.valor_total,
        couponId: pedido.cupom_id || null,
        startDate: pedido.data_inicio ? new Date(pedido.data_inicio) : new Date(),
        endDate: pedido.data_fim ? new Date(pedido.data_fim) : new Date()
      });
      if (result?.success) {
        console.log('✅ Checkout criado, redirecionando para Mercado Pago');
        // O hook já faz o redirecionamento automaticamente
      } else {
        throw new Error(result?.error || 'Erro ao criar checkout');
      }
    } catch (error: any) {
      console.error('❌ Erro ao processar pagamento com cartão:', error);
      toast.error('Erro ao processar pagamento', {
        description: error.message || 'Tente novamente em instantes'
      });
    }
  };

  // Return mobile version directly without wrapper layout since it's already handled by ResponsiveAdvertiserLayout
  if (isMobile) {
    return <MobileAdvertiserOrders />;
  }

  // Verificar se um pedido está dentro do período ativo
  const isWithinActivePeriod = (order: any) => {
    if (!order.data_inicio || !order.data_fim) return false;
    const today = new Date();
    const startDate = new Date(order.data_inicio);
    const endDate = new Date(order.data_fim);
    return today >= startDate && today <= endDate;
  };
  const stats = {
    // Pedidos ativos: pagos, com vídeo aprovado ou ativo e dentro do período
    pedidosAtivos: orders.filter(order => (order.status === 'video_aprovado' || order.status === 'ativo') && isWithinActivePeriod(order)).length,
    // Tentativas: compras não finalizadas
    tentativas: attempts.length,
    // Aguardando Vídeo: pedidos pagos mas aguardando envio de vídeo
    aguardandoVideo: orders.filter(order => ['pago', 'pago_pendente_video'].includes(order.status)).length,
    // Pedidos finalizados: expirados ou fora do período
    pedidosFinalizados: orders.filter(order => order.status === 'expirado' || ['pago', 'pago_pendente_video', 'video_aprovado'].includes(order.status) && !isWithinActivePeriod(order)).length
  };

  // Filtrar itens
  const filteredItems = userOrdersAndAttempts.filter(item => {
    const matchesSearch = item.type === 'order' && item.nome_pedido && item.nome_pedido.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase()) || item.valor_total.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || item.type === 'order' && item.status === statusFilter || item.type === 'attempt' && statusFilter === 'tentativa';
    return matchesSearch && matchesStatus;
  });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const OrderCard = ({
    item
  }: {
    item: any;
  }) => {
    const statusInfo = useOrderStatus(item, handleGeneratePix, handleStripePayment);
    const StatusIcon = statusInfo.icon;
    const painelsList = item.type === 'order' ? item.lista_paineis || [] : item.predios_selecionados || [];

    // Handle "Finalizar Compra" for attempts
    const handleFinalizarCompra = async () => {
      if (item.type === 'attempt') {
        await finalizeAttemptToOrder(item.id);
      }
    };
    return <Card className={cn('hover:shadow-lg transition-all duration-200 border-l-4', item.type === 'attempt' ? 'border-l-orange-500' : 'border-l-exa-red')}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 space-y-3">
              <div className="flex items-center space-x-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', item.type === 'attempt' ? 'bg-orange-500/10' : 'bg-exa-red/10')}>
                  <StatusIcon className={cn('h-5 w-5', item.type === 'attempt' ? 'text-orange-500' : statusInfo.color.replace('text-', ''))} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {item.type === 'order' && item.nome_pedido ? `${item.nome_pedido} • #${item.id.substring(0, 8)}` : `${item.type === 'attempt' ? 'Tentativa' : 'Pedido'} #${item.id.substring(0, 8)}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Criado em {formatDate(item.created_at)}
                    {item.type === 'order' && item.nome_pedido && <span className="ml-2 text-xs text-exa-red">• Nome personalizado</span>}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className={cn('font-semibold text-lg', item.type === 'attempt' ? 'text-orange-600' : 'text-gray-900')}>
                    {formatCurrency(item.valor_total || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duração</p>
                  <p className="font-medium">
                    {item.type === 'order' ? `${item.plano_meses} meses` : '1 mês (est.)'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Locais</p>
                  <p className="font-medium">{painelsList.length} selecionados</p>
                </div>
                <div>
                  <p className="text-gray-500">Número de Exibições</p>
                  <p className="font-medium flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {((painelsList.length || 0) * (item.plano_meses || 1) * 5000).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:items-end space-y-3">
              <Badge className={cn('border flex items-center space-x-1', statusInfo.bgColor)}>
                <StatusIcon className="h-3 w-3" />
                <span>{statusInfo.label}</span>
              </Badge>

              <div className="flex space-x-2">
                {/* Botão de ação principal (Pagar com PIX, Enviar Vídeo, etc.) */}
                {statusInfo.action && <Button variant={statusInfo.action.variant} size="sm" onClick={() => {
                if (item.type === 'attempt') {
                  handleFinalizarCompra();
                } else if (statusInfo.action?.onClick) {
                  statusInfo.action.onClick();
                } else if (statusInfo.action?.href) {
                  navigate(statusInfo.action.href);
                }
              }} disabled={isProcessingAttempt || isGeneratingPix}>
                    {isGeneratingPix && item.status === 'pendente' ? <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Gerando...
                      </> : statusInfo.action.label}
                  </Button>}
                
                {/* Botão de detalhes sempre visível para pedidos */}
                {item.type === 'order' && <Button variant="outline" size="sm" onClick={() => {
                console.log('📋 Navegando para detalhes do pedido:', item.id);
                navigate(`/anunciante/pedido/${item.id}`);
              }}>
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>;
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-exa-red" />
        <p className="ml-2 text-lg">Carregando seus pedidos...</p>
      </div>;
  }
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'}
        </p>
        <Button onClick={() => navigate('/paineis-digitais/loja')} size="sm" className="bg-exa-red hover:bg-exa-red/90">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats Cards - Compacto */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.pedidosAtivos}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold text-blue-600">{stats.aguardandoVideo}</p>
              </div>
              <Upload className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pedidosFinalizados}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Buscar por ID do pedido ou valor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="tentativa">Tentativas</SelectItem>
                <SelectItem value="pago">Aguardando Vídeo</SelectItem>
                <SelectItem value="video_aprovado">Em Exibição</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredItems.length === 0 ? <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">
              {searchTerm || statusFilter !== 'todos' ? 'Nenhum pedido encontrado' : 'Você ainda não fez nenhum pedido'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'todos' ? 'Tente ajustar os filtros para encontrar seus pedidos.' : 'Comece criando sua primeira campanha publicitária.'}
            </p>
            <Button onClick={() => navigate('/paineis-digitais/loja')} className="bg-indexa-purple hover:bg-indexa-purple/90">
              Explorar Painéis
            </Button>
          </CardContent>
        </Card> : <div className="grid gap-6">
          {filteredItems.map(item => <OrderCard key={`${item.type}-${item.id}`} item={item} />)}
        </div>}

      {/* Video Display Popup */}
      {videoDisplayPopup.orderId && <VideoDisplayPopup orderId={videoDisplayPopup.orderId} isOpen={videoDisplayPopup.isOpen} onClose={() => setVideoDisplayPopup({
      isOpen: false,
      orderId: null
    })} />}

      {/* Cortesia Success Modal */}
      <CortesiaOrderSuccessModal isOpen={showModal} pedidoId={orderData?.id || ''} buildingName={orderData?.selected_buildings?.[0]?.nome || orderData?.nomes_predios?.[0]} buildingAddress={`${orderData?.selected_buildings?.[0]?.endereco || ''}, ${orderData?.selected_buildings?.[0]?.bairro || ''}`} panelCount={orderData?.lista_paineis?.length || orderData?.selected_buildings?.length || 1} onClose={closeModal} />
      
      {/* PIX QR Code Dialog */}
      <PixQrCodeDialog isOpen={pixDialog.isOpen} onClose={() => setPixDialog({
      isOpen: false,
      pixData: null
    })} qrCodeBase64={pixDialog.pixData?.qrCodeBase64} qrCodeText={pixDialog.pixData?.qrCodeText} userId={userProfile?.id} pedidoId={pixDialog.pixData?.pedidoId} />
    </div>;
};
export default AdvertiserOrders;