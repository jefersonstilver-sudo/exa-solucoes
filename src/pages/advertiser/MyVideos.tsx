import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileText } from 'lucide-react';
import { useVideoReportData } from '@/hooks/useVideoReportData';
import { CampaignSummaryStats } from '@/components/advertiser/CampaignSummaryStats';
import { CampaignReportCard } from '@/components/advertiser/CampaignReportCard';
import { Card, CardContent } from '@/components/ui/card';

const MyVideos = () => {
  const { userProfile } = useAuth();
  const { campaigns, summary, loading } = useVideoReportData(userProfile?.id);

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
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Relatório de Campanhas
        </h1>
        <p className="text-gray-600">
          Acompanhe o desempenho das suas campanhas com métricas e gráficos em tempo real
        </p>
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
