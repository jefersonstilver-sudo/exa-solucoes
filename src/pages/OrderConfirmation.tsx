
import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useUserSession } from '@/hooks/useUserSession';
import { useOrderDetailsOptimized } from '@/hooks/useOrderDetailsOptimized';

// Lazy load components
const SuccessHeader = lazy(() => import('@/components/order-confirmation/SuccessHeader'));
const OrderSummary = lazy(() => import('@/components/order-confirmation/OrderSummary'));
const VideoRequirements = lazy(() => import('@/components/order-confirmation/VideoRequirements'));
const UploadStatus = lazy(() => import('@/components/order-confirmation/UploadStatus'));

// Loading skeleton para a página
const OrderConfirmationSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="h-16 w-16 bg-green-100 rounded-full mx-auto mb-4 animate-pulse"></div>
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 w-48 bg-gray-200 rounded mx-auto animate-pulse"></div>
      </motion.div>
      
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useUserSession();
  
  // Get order ID from URL params or localStorage (fallback)
  const orderId = searchParams.get('id') || localStorage.getItem('lastCompletedOrderId');
  
  // Use optimized hook
  const {
    orderDetails,
    loading,
    error,
    refetch
  } = useOrderDetailsOptimized(orderId || '', user?.id || '');

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20 }
  };

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <motion.div
          initial="initial"
          animate="animate"
          variants={pageVariants}
        >
          <OrderConfirmationSkeleton />
        </motion.div>
      </Layout>
    );
  }

  // Error state
  if (error || !orderDetails) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-medium mb-2 text-gray-900">
            {error ? 'Erro ao carregar pedido' : 'Pedido não encontrado'}
          </h2>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            {error || 'Não foi possível carregar os detalhes do seu pedido.'}
          </p>
          <div className="flex gap-3">
            <Button onClick={refetch} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.href = '/anunciante/pedidos'}>
              Ver Meus Pedidos
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="container mx-auto px-4 py-8 md:py-12"
      >
        <div className="max-w-3xl mx-auto">
          <Suspense fallback={<OrderConfirmationSkeleton />}>
            {/* Success Header with Animation */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <SuccessHeader />
            </motion.div>
            
            {/* Order Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <OrderSummary orderDetails={orderDetails} />
            </motion.div>
            
            {/* File Upload Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 shadow-md border-2 border-indexa-purple/20 bg-white">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Próximo Passo: Upload do Vídeo
                    </h2>
                    <p className="text-gray-600">
                      Envie o vídeo que será exibido nos painéis selecionados.
                    </p>
                  </div>
                  
                  <VideoRequirements />
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Como prosseguir:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                      <li>Acesse "Meus Pedidos" no menu</li>
                      <li>Clique em "Ver Detalhes" deste pedido</li>
                      <li>Faça o upload do seu vídeo</li>
                      <li>Aguarde a aprovação da nossa equipe</li>
                    </ol>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={() => window.location.href = `/anunciante/pedidos/${orderDetails.id}`}
                      className="flex-1"
                    >
                      Ir para Detalhes do Pedido
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/anunciante/pedidos'}
                      variant="outline"
                    >
                      Ver Todos os Pedidos
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Suspense>
        </div>
      </motion.div>
    </Layout>
  );
};

export default OrderConfirmation;
