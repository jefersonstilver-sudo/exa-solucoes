import React, { useState } from 'react';
import { ChevronDown, Download, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CampaignReport } from '@/hooks/useVideoReportData';
import { CampaignPerformanceChart } from './CampaignPerformanceChart';
import { VideoListItem } from './VideoListItem';
import { CampaignPDFExporter } from './CampaignPDFExporter';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CampaignReportCardProps {
  campaign: CampaignReport;
}

export const CampaignReportCard = ({ campaign }: CampaignReportCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const pdfExporter = new CampaignPDFExporter();
      
      const pdfData = {
        pedidoId: campaign.pedidoId,
        clientName: campaign.clientName,
        clientEmail: campaign.clientEmail,
        status: campaign.status,
        dataInicio: campaign.dataInicio,
        dataFim: campaign.dataFim,
        progress: campaign.progress,
        totalExibicoes: campaign.totalExibicoes,
        totalHoras: campaign.totalHoras,
        totalPredios: campaign.predios.length,
        videos: campaign.videos,
        predios: campaign.predios,
        chartElementId: `chart-${campaign.pedidoId}`,
      };

      const blob = await pdfExporter.generateReport(pdfData);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-campanha-${campaign.pedidoId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
    >
      {/* Header - Sempre visível */}
      <div className="bg-gradient-to-br from-background via-background to-accent/5 border-b border-border/40 p-6">
        <div className="flex items-start justify-between mb-4">
          <CollapsibleTrigger className="flex-1 text-left">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Pedido #{campaign.pedidoId.substring(0, 8)}
              </h3>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {campaign.status}
              </Badge>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(campaign.dataInicio)} → {formatDate(campaign.dataFim)}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {campaign.diasAtivos} dias ativos
              </span>
            </div>
          </CollapsibleTrigger>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Gerando...' : 'Baixar Relatório'}
          </Button>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso da campanha</span>
            <span className="font-semibold text-[#9C1E1E]">{campaign.progress.toFixed(0)}%</span>
          </div>
          <Progress value={campaign.progress} className="h-2" />
        </div>
      </div>

      {/* Conteúdo Expansível */}
      <CollapsibleContent>
        <div className="p-6 space-y-6">
          {/* Métricas Resumidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Exibições</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">{formatNumber(campaign.totalExibicoes)}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Horas Totais</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">{campaign.totalHoras.toFixed(1)}h</p>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Prédios</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">{campaign.predios.length}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Telas</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">{campaign.totalTelas}</p>
            </div>
          </div>

          {/* Gráfico de Performance */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" id={`chart-${campaign.pedidoId}`}>
            <h4 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-[#9C1E1E]" />
              Evolução da Campanha
            </h4>
            <CampaignPerformanceChart data={campaign.chartData.videoTimeline} />
          </div>

          {/* Lista de Vídeos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-base font-semibold text-gray-900">
                Vídeos da Campanha ({campaign.videos.length})
              </h4>
            </div>
            <div className="divide-y divide-gray-100">
              {campaign.videos.map((video) => (
                <VideoListItem
                  key={video.id}
                  {...video}
                  diasAtivos={campaign.diasAtivos}
                  totalTelas={campaign.totalTelas}
                  isActive={video.approvalStatus === 'approved'}
                />
              ))}
            </div>
          </div>

          {/* Lista de Prédios */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h4 className="text-base font-semibold mb-4 text-gray-900">
              Prédios Ativos ({campaign.predios.length})
            </h4>
            <div className="space-y-2">
              {campaign.predios.map((predio) => (
                <div
                  key={predio.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#9C1E1E] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{predio.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {predio.endereco} - {predio.bairro}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#9C1E1E]">{predio.quantidadeTelas}</p>
                    <p className="text-xs text-muted-foreground">telas</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
