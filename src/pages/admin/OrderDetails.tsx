
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealOrderDetails } from '@/hooks/useRealOrderDetails';
import { ProfessionalOrderReport } from '@/components/admin/orders/ProfessionalOrderReport';
import { ProfessionalPDFExporter } from '@/components/admin/orders/ProfessionalPDFExporter';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, orderDetails, orderVideos, panelData, refetch } = useRealOrderDetails(id || '');
  const [isExporting, setIsExporting] = React.useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Botões de ação */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/super_admin/pedidos')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7A1818] hover:to-[#B91C1C] text-white font-semibold shadow-lg transition-all"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Gerando PDF...' : 'Exportar PDF'}
          </Button>
        </div>

        {/* Relatório Profissional */}
        <ProfessionalOrderReport 
          order={orderDetails}
          panels={panelData}
          videos={orderVideos}
          onBuildingChanged={refetch}
        />
      </div>
    </div>
  );
};

export default OrderDetails;
