
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { RealOrderHeader } from '@/components/admin/orders/RealOrderHeader';
import { RealOrderCustomerCard } from '@/components/admin/orders/RealOrderCustomerCard';
import { RealOrderInfoCard } from '@/components/admin/orders/RealOrderInfoCard';
import { RealOrderFinancialCard } from '@/components/admin/orders/RealOrderFinancialCard';
import { RealOrderPanelsCard } from '@/components/admin/orders/RealOrderPanelsCard';
import { RealOrderVideosCard } from '@/components/admin/orders/RealOrderVideosCard';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, orderDetails, orderVideos, panelData } = useRealOrderDetails(id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-indexa-purple mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Carregando detalhes do pedido...</h2>
          <p className="text-gray-600 mt-2">Aguarde enquanto buscamos as informações</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900">Pedido não encontrado</h2>
          <p className="text-gray-600 mt-2">O pedido solicitado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Botão de voltar */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/super_admin/pedidos')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>

        {/* Header com informações principais e export profissional */}
        <RealOrderHeader 
          order={orderDetails} 
          panels={panelData}
          videos={orderVideos}
        />

        {/* Grid de informações principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações do Cliente */}
          <RealOrderCustomerCard order={orderDetails} />

          {/* Informações do Pedido */}
          <RealOrderInfoCard order={orderDetails} />

          {/* Resumo Financeiro */}
          <RealOrderFinancialCard order={orderDetails} />
        </div>

        {/* Seção de Painéis */}
        <RealOrderPanelsCard panels={panelData} order={orderDetails} />

        {/* Seção de Gestão de Vídeos */}
        <RealOrderVideosCard videos={orderVideos} orderId={orderDetails.id} />
      </div>
    </div>
  );
};

export default OrderDetails;
