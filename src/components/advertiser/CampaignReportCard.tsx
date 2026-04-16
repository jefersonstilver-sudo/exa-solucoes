import React, { useState } from 'react';
import { ChevronDown, Download, Calendar, MapPin, TrendingUp, Monitor, Smartphone } from 'lucide-react';
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
  CollapsibleTrigger } from
'@/components/ui/collapsible';

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
      year: 'numeric'
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

  const formatDisplayTime = (hours: number): string => {
    const totalSeconds = Math.round(hours * 3600);
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    if (totalSeconds < 3600) {
      const min = Math.floor(totalSeconds / 60);
      const sec = totalSeconds % 60;
      return sec > 0 ? `${min}m${sec}s` : `${min}min`;
    }
    return `${hours.toFixed(1)}h`;
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
        chartElementId: `chart-${campaign.pedidoId}`
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

  // Contar vídeos ativos vs inativos
  const videosAtivos = campaign.videos.filter((v) => 
    (v.isActive && v.selectedForDisplay && v.approvalStatus === 'approved') ||
    (v.approvalStatus === 'approved' && v.scheduleInfo?.startsWith('Agendado'))
  ).length;
  const videosInativos = campaign.videos.length - videosAtivos;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      
      {/* Header - Sempre visível */}
      <div className="bg-gradient-to-br from-background via-background to-accent/5 border-b border-border/40 p-6">
        <div className="flex items-start justify-between mb-4">
          <CollapsibleTrigger className="flex-1 text-left">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-xl font-semibold text-gray-900">
                {campaign.nomePedido}
              </h3>
              {campaign.tipoProduto?.toLowerCase().includes('vertical') ? (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-sm font-semibold px-3 py-1 gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Vertical Premium
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-sm font-semibold px-3 py-1 gap-1.5">
                  <Monitor className="w-4 h-4" />
                  Horizontal
                </Badge>
              )}
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {campaign.status}
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Exibições do Sistema
              </Badge>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''}`
                } />
              
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Contrato: {formatDate(campaign.dataInicio)} → {formatDate(campaign.dataFim)}
              </span>
              <span className="text-xs bg-accent/50 px-2 py-0.5 rounded-full">
                Período: {formatDate(campaign.filteredStartDate)} → {formatDate(campaign.filteredEndDate)} ({campaign.diasAtivos} {campaign.diasAtivos === 1 ? 'dia' : 'dias'})
              </span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                📊 Exibições calculadas conforme programação do sistema
              </span>
            </div>
          </CollapsibleTrigger>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm">
            
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
              <p className="text-xs text-muted-foreground mb-1">Tempo Total</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">{formatDisplayTime(campaign.totalHoras)}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-border/40">
              <p className="text-xs text-muted-foreground mb-1">Prédios Ativos</p>
              <p className="text-2xl font-bold text-[#9C1E1E]">
                {campaign.predios.length}
              </p>
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
              <p className="text-xs text-muted-foreground mt-1">
                {videosAtivos} em exibição · {videosInativos} inativos
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {campaign.videos.map((video) =>
              <VideoListItem
                key={video.id}
                {...video} />

              )}
            </div>
          </div>

          {/* Lista de Prédios */}
          























          
        </div>
      </CollapsibleContent>
    </Collapsible>);

};