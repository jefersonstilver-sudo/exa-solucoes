import React, { useState } from 'react';
import { Calendar, TrendingUp, Building2, Tv, Users, Download, ChevronDown } from 'lucide-react';
import { CampaignReport } from '@/hooks/useVideoReportData';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VideoThumbnailGrid } from './VideoThumbnailGrid';
import { CampaignPerformanceChart } from './CampaignPerformanceChart';
import { BuildingReportRow } from './BuildingReportRow';
import { MetricBox } from './MetricBox';

interface CampaignReportCardProps {
  campaign: CampaignReport;
}

export const CampaignReportCard = ({ campaign }: CampaignReportCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100/50 shadow-lg overflow-hidden"
    >
      {/* Header da Campanha (sempre visível) */}
      <CollapsibleTrigger className="w-full">
        <div className="bg-gradient-to-r from-[#9C1E1E]/5 to-[#9C1E1E]/10 border-b border-border/40 p-6 hover:from-[#9C1E1E]/10 hover:to-[#9C1E1E]/15 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Campanha #{campaign.pedidoId.slice(0, 8)}
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
                  {campaign.diasAtivos} dias ativos · {campaign.diasRestantes} dias restantes
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={(e) => e.stopPropagation()}>
              <Download className="w-4 h-4" />
              Baixar Relatório
            </Button>
          </div>
          
          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso da campanha</span>
              <span className="font-semibold text-[#9C1E1E]">{campaign.progresso.toFixed(0)}%</span>
            </div>
            <Progress value={campaign.progresso} className="h-2" />
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Conteúdo Expansível */}
      <CollapsibleContent>
        <div className="p-6 space-y-6">
          {/* Métricas Resumidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox
              icon={Tv}
              value={formatNumber(campaign.exibicoesEstimadas)}
              label="Exibições Estimadas"
            />
            <MetricBox
              icon={Users}
              value={formatNumber(campaign.publicoImpactado)}
              label="Público Impactado"
            />
            <MetricBox
              icon={Building2}
              value={campaign.buildings.length}
              label="Prédios Ativos"
            />
            <MetricBox
              icon={TrendingUp}
              value={campaign.totalTelas}
              label="Total de Telas"
            />
          </div>

          {/* Gráfico de Evolução */}
          <CampaignPerformanceChart 
            data={campaign.chartData.videoTimeline} 
            dataInicio={campaign.dataInicio}
            dataFim={campaign.dataFim}
          />

          {/* Grid de Vídeos */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              🎬 Vídeos da Campanha ({campaign.videos.length})
            </h4>
            <VideoThumbnailGrid videos={campaign.videos} />
          </div>

          {/* Lista de Prédios */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              🏢 Prédios em Exibição ({campaign.buildings.length})
            </h4>
            <div className="space-y-2">
              {campaign.buildings.map((building) => (
                <BuildingReportRow key={building.id} building={building} />
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
