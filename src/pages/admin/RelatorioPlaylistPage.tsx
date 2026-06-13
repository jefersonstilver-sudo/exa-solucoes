import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useGlobalPlaylistReport } from '@/hooks/useGlobalPlaylistReport';
import ReportHeader from '@/components/admin/buildings/relatorio-playlist/ReportHeader';
import ReportDashboard from '@/components/admin/buildings/relatorio-playlist/ReportDashboard';
import ReportAlerts from '@/components/admin/buildings/relatorio-playlist/ReportAlerts';
import ReportByBuilding from '@/components/admin/buildings/relatorio-playlist/ReportByBuilding';
import ReportActiveOrders from '@/components/admin/buildings/relatorio-playlist/ReportActiveOrders';
import ReportSkeleton from '@/components/admin/buildings/relatorio-playlist/ReportSkeleton';
import '@/components/admin/buildings/relatorio-playlist/report-print.css';

const RelatorioPlaylistPage: React.FC = () => {
  const { userProfile, isAdmin, isLoading } = useAuth();
  const { data, loading, error, refetch } = useGlobalPlaylistReport();

  const userLabel = useMemo(() => {
    if (!userProfile) return '—';
    return (
      (userProfile as any).nome ||
      (userProfile as any).full_name ||
      userProfile.email ||
      '—'
    );
  }, [userProfile]);

  if (isLoading) return <div className="p-6"><ReportSkeleton /></div>;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="report-root min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {loading && !data ? (
          <ReportSkeleton />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
            <h2 className="font-semibold mb-2">Erro ao carregar relatório</h2>
            <p className="text-sm">{error}</p>
            <button
              onClick={refetch}
              className="mt-3 px-3 py-1.5 bg-[#C7141A] text-white rounded-lg text-sm"
            >
              Tentar novamente
            </button>
          </div>
        ) : data ? (
          <>
            <ReportHeader
              generatedAt={data.generatedAt}
              userLabel={userLabel}
              totalPredios={data.kpis.totalPredios}
              totalVideos={data.kpis.totalVideos}
              totalAlertas={data.kpis.totalAlertas}
              loading={loading}
              onRefresh={refetch}
            />
            <ReportActiveOrders report={data} />
            <ReportDashboard report={data} />
            <ReportAlerts report={data} />
            <ReportByBuilding report={data} />
            <footer className="mt-8 text-center text-xs text-slate-400 print:text-slate-700">
              EXA Mídia — Relatório de Playlist em Exibição · {new Date(data.generatedAt).toLocaleString('pt-BR')}
            </footer>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default RelatorioPlaylistPage;
