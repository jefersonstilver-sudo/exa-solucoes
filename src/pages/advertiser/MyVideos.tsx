import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileText, FlaskConical } from 'lucide-react';
import { useVideoReportData, DateRange } from '@/hooks/useVideoReportData';
import { CampaignSummaryStats } from '@/components/advertiser/CampaignSummaryStats';
import { CampaignReportCard } from '@/components/advertiser/CampaignReportCard';
import { PeriodFilter } from '@/components/advertiser/PeriodFilter';
import { Card, CardContent } from '@/components/ui/card';
import { subDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MyVideos = () => {
  const { userProfile } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: subDays(new Date(), 1),
  });
  const { campaigns, summary, loading } = useVideoReportData(userProfile?.id, dateRange);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#9C1E1E]" />
        <p className="ml-2 text-lg text-gray-600">Carregando relatório de campanhas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner Beta */}
      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <FlaskConical className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          🧪 Esta página está em fase de testes (Beta). Os dados exibidos podem sofrer ajustes.
        </AlertDescription>
      </Alert>

      {/* Header com Filtro */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
        <div className="flex flex-col space-y-1">
          <h1 className="text-lg md:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
            Relatório de Campanhas
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Acompanhe o desempenho das suas campanhas
          </p>
        </div>
        <PeriodFilter onPeriodChange={setDateRange} defaultPeriod="30d" />
      </div>

      {/* Métricas Resumidas */}
      <CampaignSummaryStats summary={summary} />

      {/* Cards de Campanhas com Gráficos */}
      {campaigns.length > 0 ? (
        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <CampaignReportCard key={campaign.pedidoId} campaign={campaign} />
          ))}
        </div>
      ) : (
        <Card className="shadow-lg rounded-2xl border-gray-100">
          <CardContent className="p-12 text-center">
            <div className="mx-auto bg-gray-50 rounded-full p-6 w-20 h-20 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Nenhuma campanha encontrada
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Você ainda não possui campanhas ativas. Quando seus vídeos estiverem em exibição, 
              os relatórios detalhados aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyVideos;
