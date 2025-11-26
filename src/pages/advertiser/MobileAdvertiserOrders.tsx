
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  ShoppingBag, 
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MobileDrawerNavigation from '@/components/mobile/MobileDrawerNavigation';
import { CortesiaOrderSuccessModal } from '@/components/orders/CortesiaOrderSuccessModal';
import { useCortesiaSuccessDetection } from '@/hooks/useCortesiaSuccessDetection';

interface Order {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  nome_pedido?: string;
}

interface OrderStats {
  pedidosAtivos: number;
  aguardandoVideo: number;
  pedidosFinalizados: number;
}

const MobileAdvertiserOrders = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    pedidosAtivos: 0,
    aguardandoVideo: 0,
    pedidosFinalizados: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    setupSwipeHandlers, 
    isRefreshing, 
    vibrate 
  } = useMobileOptimization();

  // Detect cortesia order success
  const { showModal, orderData, closeModal } = useCortesiaSuccessDetection(orders, loading);

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = setupSwipeHandlers(containerRef.current, {
        onPullRefresh: loadOrders,
        onSwipeLeft: () => navigate('/anunciante/videos'),
        onSwipeRight: () => navigate('/anunciante')
      });
      return cleanup;
    }
  }, [setupSwipeHandlers, navigate]);

  useEffect(() => {
    loadOrders();
  }, [userProfile]);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, orders]);

  const loadOrders = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pedidos')
        .select('*, nome_pedido')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se um pedido está dentro do período ativo
  const isWithinActivePeriod = (order: Order) => {
    if (!order.data_inicio || !order.data_fim) return false;
    const today = new Date();
    const startDate = new Date(order.data_inicio);
    const endDate = new Date(order.data_fim);
    return today >= startDate && today <= endDate;
  };

  const calculateStats = (ordersList: Order[]) => {
    const now = new Date();
    
    const pedidosAtivos = ordersList.filter(order => {
      if (!order.data_inicio || !order.data_fim) return false;
      const startDate = new Date(order.data_inicio);
      const endDate = new Date(order.data_fim);
      return (order.status === 'video_aprovado' || order.status === 'ativo') && 
             now >= startDate && now <= endDate;
    }).length;

    const aguardandoVideo = ordersList.filter(order => 
      order.status === 'pago_pendente_video'
    ).length;
    
    const pedidosFinalizados = ordersList.filter(order => 
      order.status === 'finalizado' || order.status === 'expirado'
    ).length;

    setStats({ pedidosAtivos, aguardandoVideo, pedidosFinalizados });
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.valor_total.toString().includes(searchTerm) ||
        (order.nome_pedido && order.nome_pedido.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pago':
      case 'pago_pendente_video':
        return {
          label: 'Aguardando Vídeo',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Upload
        };
      case 'video_aprovado':
        return {
          label: 'EM EXIBIÇÃO',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock
        };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatsCards = () => {
    const statsData = [
      { 
        label: 'Ativos', 
        value: stats.pedidosAtivos, 
        color: 'bg-green-500',
        icon: CheckCircle
      },
      { 
        label: 'Aguardando', 
        value: stats.aguardandoVideo, 
        color: 'bg-blue-500',
        icon: Upload
      },
      { 
        label: 'Finalizados', 
        value: stats.pedidosFinalizados, 
        color: 'bg-gray-500',
        icon: CheckCircle
      }
    ];

    return (
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-3 shadow-lg"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-500 leading-tight">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#9C1E1E] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando pedidos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Drawer Navigation */}
      <MobileDrawerNavigation
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-white border-b"
          >
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={containerRef} className="pb-20">
        <div className="px-4 py-4">

          {/* Stats Cards */}
          {orders.length > 0 && getStatsCards()}

          {/* Orders List */}
          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-[#9C1E1E] hover:shadow-2xl transition-all duration-300 rounded-2xl shadow-lg">
                        <CardContent className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-base mb-1">
                                {order.nome_pedido ? `${order.nome_pedido} • #${order.id.substring(0, 8)}` : `Pedido #${order.id.substring(0, 8)}`}
                              </h3>
                              {order.nome_pedido && (
                                <p className="text-xs text-[#9C1E1E] mb-1">Nome personalizado</p>
                              )}
                              <Badge className={`${statusConfig.color} border flex items-center space-x-1 w-fit`}>
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusConfig.label}</span>
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(order.valor_total || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <p className="text-gray-500">Duração</p>
                              <p className="font-medium text-gray-900">
                                {order.plano_meses} {order.plano_meses === 1 ? 'mês' : 'meses'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Painéis</p>
                              <p className="font-medium text-gray-900">
                                {order.lista_paineis?.length || 0} selecionados
                              </p>
                            </div>
                          </div>

                          {/* Action */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              vibrate();
                              navigate(`/anunciante/pedido/${order.id}`);
                            }}
                            className="w-full h-9 border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
                          >
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-4"
            >
              <div className="mx-auto w-24 h-24 bg-[#9C1E1E]/10 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-12 w-12 text-[#9C1E1E]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                {searchTerm 
                  ? 'Nenhum pedido corresponde à sua busca. Tente outro termo.'
                  : 'Você ainda não fez nenhum pedido. Comece criando sua primeira campanha!'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => {
                    vibrate();
                    navigate('/paineis-digitais/loja');
                  }}
                  className="bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Explorar Painéis
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Cortesia Success Modal */}
      <CortesiaOrderSuccessModal
        isOpen={showModal}
        pedidoId={orderData?.id || ''}
        buildingName={orderData?.selected_buildings?.[0]?.nome || orderData?.nomes_predios?.[0]}
        buildingAddress={`${orderData?.selected_buildings?.[0]?.endereco || ''}, ${orderData?.selected_buildings?.[0]?.bairro || ''}`}
        panelCount={orderData?.lista_paineis?.length || orderData?.selected_buildings?.length || 1}
        onClose={closeModal}
      />
    </div>
  );
};

export default MobileAdvertiserOrders;
