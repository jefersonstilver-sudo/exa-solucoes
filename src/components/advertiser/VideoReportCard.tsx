import React from 'react';
import { Play, Tv, Users, Building2, Calendar, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricBox } from './MetricBox';
import { BuildingReportRow } from './BuildingReportRow';
import { VideoReport } from '@/hooks/useVideoReportData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoReportCardProps {
  video: VideoReport;
}

export const VideoReportCard = ({ video }: VideoReportCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            ✅ Aprovado
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ⏳ Em Análise
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            ❌ Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      {/* Header: Thumbnail + Info */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Thumbnail com overlay de play */}
        <div className="relative w-full md:w-56 h-40 md:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-700 flex-shrink-0 group">
          <video 
            src={video.url} 
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-[#9C1E1E] ml-1" fill="#9C1E1E" />
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900 truncate flex-1">{video.nome}</h3>
            {getStatusBadge(video.status)}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#9C1E1E]" />
              {formatDuration(video.duracao)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#9C1E1E]" />
              {formatDate(video.dataInicio)} → {formatDate(video.dataFim)}
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Início</span>
              <span className="font-medium text-[#9C1E1E]">{Math.round(video.progresso)}% concluído</span>
              <span>Fim</span>
            </div>
            <Progress value={video.progresso} className="h-2" />
          </div>
        </div>
      </div>

      {/* Métricas Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricBox 
          icon={Tv} 
          value={formatNumber(video.exibicoesEstimadas)} 
          label="Exibições Estimadas" 
        />
        <MetricBox 
          icon={Users} 
          value={formatNumber(video.publicoImpactado)} 
          label="Pessoas Impactadas" 
        />
        <MetricBox 
          icon={Building2} 
          value={video.buildings.length} 
          label={video.buildings.length === 1 ? 'Prédio Ativo' : 'Prédios Ativos'} 
        />
        <MetricBox 
          icon={Calendar} 
          value={video.diasAtivos} 
          label={video.diasAtivos === 1 ? 'Dia Ativo' : 'Dias Ativos'} 
        />
      </div>

      {/* Lista de Prédios */}
      {video.buildings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#9C1E1E]" />
            Prédios em Exibição ({video.buildings.length})
          </h4>
          <div className="space-y-2">
            {video.buildings.map((building) => (
              <BuildingReportRow key={building.id} building={building} />
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="border-[#9C1E1E]/20 text-[#9C1E1E] hover:bg-[#9C1E1E]/10 hover:text-[#9C1E1E] hover:border-[#9C1E1E]/30"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar Relatório PDF
        </Button>
      </div>
    </div>
  );
};
