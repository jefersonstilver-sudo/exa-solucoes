
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessionalPDFExporter } from './ProfessionalPDFExporter';

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
    log_pagamento?: any;
    cupom_id?: string;
    termos_aceitos?: boolean;
  };
  panels?: Array<{
    id: string;
    nome: string;
    endereco: string;
    bairro: string;
  }>;
  videos?: Array<{
    id: string;
    slot_position: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    is_active: boolean;
    selected_for_display: boolean;
    video_data?: {
      nome: string;
      duracao: number;
      orientacao: string;
    };
  }>;
}

export const RealOrderHeader: React.FC<RealOrderHeaderProps> = ({ 
  order, 
  panels = [], 
  videos = [] 
}) => {
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

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      const exporter = new ProfessionalPDFExporter();
      await exporter.generateReport(order, panels, videos);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
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
            {isExporting ? 'Gerando...' : 'Relatório Profissional'}
          </Button>
        </div>
      </div>
    </div>
  );
};
