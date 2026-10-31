
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { ProfessionalOrderReport } from '@/components/admin/orders/ProfessionalOrderReport';
import { ProfessionalPDFExporter } from '@/components/admin/orders/ProfessionalPDFExporter';
import AccessAsClientButton from '@/components/impersonation/AccessAsClientButton';
import PurgePedidoVideosDialog from '@/components/impersonation/PurgePedidoVideosDialog';
import ClientOrderViewSheet from '@/components/impersonation/ClientOrderViewSheet';
import SofiaSoldBadge from '@/components/admin/orders/SofiaSoldBadge';
import ClientProfilePanel from '@/components/admin/orders/ClientProfilePanel';
import PedidoWhatsappAcessosCard from '@/components/admin/orders/PedidoWhatsappAcessosCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderCRM360Fields from '@/components/admin/crm/OrderCRM360Fields';
import OrderStatusActions from '@/components/admin/orders/OrderStatusActions';
import { pedidoStatusInfo } from '@/lib/pedidoStatus';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import CobrancaPedidoAdmin from '@/components/admin/orders/CobrancaPedidoAdmin';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, orderDetails, orderVideos, panelData, refetch } = useRealOrderDetails(id || '');
  const [isExporting, setIsExporting] = React.useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [clientViewSessionId, setClientViewSessionId] = useState<string | null>(null);
  const telaGrande = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  const handleExportPDF = async () => {
    if (!orderDetails) return;
    
    setIsExporting(true);
    try {
      const exporter = new ProfessionalPDFExporter();
      await exporter.generateReport(orderDetails, panelData, orderVideos);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <GlobalLoadingPage message="Abrindo o pedido..." />;
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
    <div className="md:min-h-screen md:bg-gradient-to-br md:from-gray-50 md:to-gray-100 pt-1 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Cabeçalho + ações (pensado primeiro para o celular) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/super_admin/pedidos')}
              className="shrink-0 h-10 w-10 rounded-full bg-white shadow-sm border border-gray-200"
              aria-label="Voltar para a lista de pedidos"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Pedido #{orderDetails.id.slice(0, 8)}</p>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{orderDetails.nome_pedido || orderDetails.client_name || 'Pedido'}</h1>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${pedidoStatusInfo(orderDetails.status).cls}`}>
              {pedidoStatusInfo(orderDetails.status).label}
            </span>
          </div>
          <SofiaSoldBadge pedidoId={id} className="text-xs px-3 py-1" />

          {/* Celular: ação principal em largura total e as demais numa fileira que rola para o lado */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end [&_button]:text-[13px] max-sm:[&_button]:h-10">
            {orderDetails?.client_id && (
              <AccessAsClientButton
                targetUserId={orderDetails.client_id}
                pedidoId={id}
                variant="default"
                className="col-span-2 sm:col-span-1 w-full sm:w-auto h-11 rounded-xl bg-[#C7141A] hover:bg-[#B40D1A] text-white"
                // computador: painel lateral; celular/app: abre a área do cliente na própria tela
                // (iframe dentro de painel no iPhone quebrava o layout e escondia o botão de sair)
                onInternalView={telaGrande ? (sid) => setClientViewSessionId(sid) : undefined}
              />
            )}
            {orderDetails?.id && (
              <OrderStatusActions
                size="default"
                grid
                pedidos={[{ id: orderDetails.id, status: orderDetails.status, nome: orderDetails.nome_pedido || orderDetails.client_name }]}
                onDone={refetch}
              />
            )}
            <Button
              variant="outline"
              onClick={() => setPurgeOpen(true)}
              className="w-full sm:w-auto h-11 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
              <span className="sm:hidden">Excluir vídeos</span>
              <span className="hidden sm:inline">Excluir todos os vídeos</span>
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full sm:w-auto h-11 rounded-xl flex items-center gap-2 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7A1818] hover:to-[#B91C1C] text-white font-semibold shadow-sm"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isExporting ? 'Gerando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pedido" className="w-full">
          <div className="mb-3 text-[13px]"><OrderCRM360Fields userId={orderDetails.client_id} email={orderDetails.email} whatsapp={orderDetails.whatsapp} /></div>
          <TabsList className="w-full sm:w-auto mb-1 rounded-full bg-black/[0.05] p-1 [&>button]:flex-1 [&>button]:rounded-full sm:[&>button]:flex-none">
            <TabsTrigger value="pedido">Pedido</TabsTrigger>
            <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
            {orderDetails?.client_id && <TabsTrigger value="perfil">Perfil do cliente</TabsTrigger>}
          </TabsList>
          <TabsContent value="pedido">
            {/* Relatório Profissional */}
            <ProfessionalOrderReport 
              order={orderDetails}
              panels={panelData}
              videos={orderVideos}
              onBuildingChanged={refetch}
            />
          </TabsContent>
          <TabsContent value="cobranca">
            <CobrancaPedidoAdmin pedidoId={orderDetails.id} clientId={orderDetails.client_id} onChanged={refetch} />
          </TabsContent>
          {orderDetails?.client_id && (
            <TabsContent value="perfil">
              <div className="space-y-4">
                <PedidoWhatsappAcessosCard
                  pedidoId={orderDetails.id}
                  clientId={orderDetails.client_id}
                  gestorWhatsapp={orderDetails.whatsapp}
                  gestorEmail={orderDetails.client_email || orderDetails.email}
                  onChanged={refetch}
                />
                <ClientProfilePanel userId={orderDetails.client_id} onSaved={refetch} />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {id && (
          <PurgePedidoVideosDialog
            open={purgeOpen}
            onOpenChange={setPurgeOpen}
            pedidoId={id}
            expectedConfirmation={id}
            onPurged={refetch}
          />
        )}

        <ClientOrderViewSheet
          open={!!clientViewSessionId}
          onOpenChange={(v) => { if (!v) setClientViewSessionId(null); }}
          pedidoId={id || null}
          sessionId={clientViewSessionId}
          clientLabel={orderDetails?.client_name || orderDetails?.client_email || null}
        />
      </div>
    </div>
  );
};

export default OrderDetails;
