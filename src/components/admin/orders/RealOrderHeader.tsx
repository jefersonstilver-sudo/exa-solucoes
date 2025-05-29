
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface RealOrderHeaderProps {
  order: {
    id: string;
    created_at: string;
    status: string;
    client_name: string;
    valor_total: number;
    client_email: string;
    data_inicio?: string;
    data_fim?: string;
    plano_meses: number;
  };
}

export const RealOrderHeader: React.FC<RealOrderHeaderProps> = ({ order }) => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string, label: string }> = {
      'pago_pendente_video': { className: 'bg-orange-600 text-white', label: 'Aguardando Vídeo' },
      'video_enviado': { className: 'bg-blue-600 text-white', label: 'Vídeo Enviado' },
      'video_aprovado': { className: 'bg-green-600 text-white', label: 'Vídeo Aprovado' },
      'video_rejeitado': { className: 'bg-red-600 text-white', label: 'Vídeo Rejeitado' },
      'pago': { className: 'bg-green-600 text-white', label: 'Pago' },
      'pendente': { className: 'bg-gray-600 text-white', label: 'Pendente' },
      'ativo': { className: 'bg-green-600 text-white', label: 'Ativo' },
      'cancelado': { className: 'bg-red-600 text-white', label: 'Cancelado' }
    };
    
    return variants[status] || { className: 'bg-gray-600 text-white', label: status };
  };

  const statusInfo = getStatusBadge(order.status);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSimpleDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      
      // Header do documento
      doc.setFontSize(20);
      doc.setTextColor(60, 19, 97); // indexa purple
      doc.text('RELATÓRIO DO PEDIDO', 20, 25);
      
      // ID do pedido
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Pedido #${order.id.substring(0, 8)}`, 20, 40);
      
      // Linha separadora
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);
      
      // Informações do cliente
      let yPosition = 55;
      doc.setFontSize(16);
      doc.setTextColor(60, 19, 97);
      doc.text('DADOS DO CLIENTE', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Nome: ${order.client_name}`, 20, yPosition);
      
      yPosition += 8;
      doc.text(`Email: ${order.client_email}`, 20, yPosition);
      
      yPosition += 8;
      doc.text(`Data do Pedido: ${formatDate(order.created_at)}`, 20, yPosition);
      
      // Informações do pedido
      yPosition += 20;
      doc.setFontSize(16);
      doc.setTextColor(60, 19, 97);
      doc.text('DETALHES DO PEDIDO', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Status: ${statusInfo.label}`, 20, yPosition);
      
      yPosition += 8;
      doc.text(`Valor Total: ${formatCurrency(order.valor_total)}`, 20, yPosition);
      
      yPosition += 8;
      doc.text(`Duração: ${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`, 20, yPosition);
      
      if (order.data_inicio && order.data_fim) {
        yPosition += 8;
        doc.text(`Período: ${formatSimpleDate(order.data_inicio)} até ${formatSimpleDate(order.data_fim)}`, 20, yPosition);
      }
      
      // Footer
      yPosition = 270;
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('Relatório gerado automaticamente pelo sistema Indexa', 20, yPosition);
      doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition + 5);
      
      // Salvar o PDF
      doc.save(`pedido-${order.id.substring(0, 8)}.pdf`);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-indexa-purple rounded-lg p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/super_admin/pedidos')}
            className="text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Pedidos
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pedido #{order.id.substring(0, 8)}</h1>
            <p className="text-purple-100 flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              Criado em {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-purple-100 text-sm">Cliente</p>
            <p className="font-semibold">{order.client_name}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">Valor Total</p>
            <p className="font-bold text-xl">{formatCurrency(order.valor_total)}</p>
          </div>
          <Badge className={`${statusInfo.className} text-sm px-3 py-1 shadow-md`}>
            {statusInfo.label}
          </Badge>
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-white text-indexa-purple hover:bg-gray-100 border-0 font-medium shadow-md transition-all duration-200"
            size="sm"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Gerando...' : 'Exportar'}
          </Button>
        </div>
      </div>
    </div>
  );
};
