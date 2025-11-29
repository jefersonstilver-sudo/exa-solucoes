import React from 'react';
import { Video, Tv, Building2, PlayCircle } from 'lucide-react';
import { AppleMetricCard } from '@/design-system/components/AppleMetricCard';
import { CampaignSummary } from '@/hooks/useVideoReportData';

interface CampaignSummaryStatsProps {
  summary: CampaignSummary;
}

export const CampaignSummaryStats = ({ summary }: CampaignSummaryStatsProps) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AppleMetricCard
        title="Vídeos Ativos"
        value={summary.totalVideosAtivos}
        icon={Video}
        iconColor="text-[#9C1E1E]"
      />
      <AppleMetricCard
        title="Total de Exibições"
        value={formatNumber(summary.totalExibicoes)}
        icon={Tv}
        iconColor="text-[#9C1E1E]"
      />
      <AppleMetricCard
        title="Vídeos Totais Exibidos"
        value={summary.totalVideosExibidos}
        icon={PlayCircle}
        iconColor="text-[#9C1E1E]"
      />
      <AppleMetricCard
        title="Prédios Ativos"
        value={summary.totalPrediosAtivos}
        icon={Building2}
        iconColor="text-[#9C1E1E]"
      />
    </div>
  );
};
