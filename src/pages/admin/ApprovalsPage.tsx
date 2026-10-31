import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, MoreVertical } from 'lucide-react';
import { useRealApprovalsData } from '@/hooks/useRealApprovalsData';
import RealPaidOrdersSection from '@/components/admin/approvals/RealPaidOrdersSection';
import RealPendingVideosSection from '@/components/admin/approvals/RealPendingVideosSection';
import RealApprovedVideosSection from '@/components/admin/approvals/RealApprovedVideosSection';
import RealRejectedVideosSection from '@/components/admin/approvals/RealRejectedVideosSection';
import AdminPeriodSelector, { PeriodType, getPeriodDates } from '@/components/admin/common/AdminPeriodSelector';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { PaginaCelular, TopoCelular, BotaoRedondo, Kpis } from '@/components/admin/celular/kit';

const ApprovalsPage = () => {
  // celular abre direto no que precisa de ação (vídeos para aprovar)
  const [activeTab, setActiveTab] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'pending-videos' : 'pending-orders'));
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const { isMobile } = useAdvancedResponsive();

  const { start, end } = useMemo(() => {
    return getPeriodDates(periodFilter, customStartDate, customEndDate);
  }, [periodFilter, customStartDate, customEndDate]);

  const { stats, loading, refetch } = useRealApprovalsData();

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodFilter(period);
  };

  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };


  // Mobile Layout
  if (isMobile) {
    const abas = [
      { id: 'pending-videos', rotulo: 'Para aprovar', valor: stats.pendingApproval, cor: stats.pendingApproval ? '#9C1E1E' : '#1E6B47' },
      { id: 'pending-orders', rotulo: 'Sem vídeo', valor: stats.paidWithoutVideo, cor: '#9A5300' },
      { id: 'approved-videos', rotulo: 'Aprovados', valor: stats.approved, cor: '#1E6B47' },
      { id: 'rejected-videos', rotulo: 'Rejeitados', valor: stats.rejected, cor: '#B0261D' },
    ];
    return (
      <PaginaCelular>
        <TopoCelular
          titulo="Aprovações"
          sub="Vídeos dos anunciantes · CONAR"
          acoes={<BotaoRedondo rotulo="Atualizar" onClick={refetch}><RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} /></BotaoRedondo>}
        />
        <Kpis
          colunas={4}
          itens={abas.map((t) => ({ rotulo: t.rotulo, valor: t.valor, cor: t.cor, ativo: activeTab === t.id, onClick: () => setActiveTab(t.id) }))}
        />
        <div className="mb-2 px-1 text-[13px] font-extrabold uppercase tracking-[0.07em] text-[#6A6B70]">
          {abas.find((t) => t.id === activeTab)?.rotulo}
        </div>
        {activeTab === 'pending-orders' && <RealPaidOrdersSection loading={loading} onRefresh={refetch} />}
        {activeTab === 'pending-videos' && <RealPendingVideosSection loading={loading} onRefresh={refetch} />}
        {activeTab === 'approved-videos' && <RealApprovedVideosSection loading={loading} onRefresh={refetch} />}
        {activeTab === 'rejected-videos' && <RealRejectedVideosSection loading={loading} onRefresh={refetch} />}
      </PaginaCelular>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Video className="h-8 w-8 mr-3 text-primary" />
            Sistema de Aprovações de Vídeos
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão completa de vídeos enviados pelos clientes - Conformidade CONAR
          </p>
        </div>

        <AdminPeriodSelector
          value={periodFilter}
          onChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Aguardando Vídeo</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.paidWithoutVideo}
                </p>
                <p className="text-xs text-muted-foreground">pedidos pagos</p>
              </div>
              <div className="rounded-full bg-muted p-3">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Para Aprovação</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.pendingApproval}
                </p>
                <p className="text-xs text-muted-foreground">vídeos enviados</p>
              </div>
              <div className="rounded-full bg-muted p-3">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.approved}
                </p>
                <p className="text-xs text-muted-foreground">vídeos ativos</p>
              </div>
              <div className="rounded-full bg-muted p-3">
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.rejected}
                </p>
                <p className="text-xs text-muted-foreground">vídeos rejeitados</p>
              </div>
              <div className="rounded-full bg-muted p-3">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Separação - Mobile scrollable */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto p-1 bg-muted overflow-x-auto scrollbar-hide flex md:grid md:grid-cols-4 gap-1">
          <TabsTrigger 
            value="pending-orders" 
            className="flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm px-3 py-2"
          >
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Aguardando</span>
            <span className="sm:hidden">Aguard.</span>
            <span>({stats.paidWithoutVideo})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending-videos" 
            className="flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm px-3 py-2"
          >
            <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Para Aprovação</span>
            <span className="sm:hidden">Aprovar</span>
            <span>({stats.pendingApproval})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approved-videos" 
            className="flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm px-3 py-2"
          >
            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Aprovados</span>
            <span className="sm:hidden">Aprov.</span>
            <span>({stats.approved})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected-videos" 
            className="flex items-center gap-1.5 whitespace-nowrap text-xs md:text-sm px-3 py-2"
          >
            <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Rejeitados</span>
            <span className="sm:hidden">Rejeit.</span>
            <span>({stats.rejected})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-orders" className="mt-6">
          <RealPaidOrdersSection loading={loading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="pending-videos" className="mt-6">
          <RealPendingVideosSection loading={loading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="approved-videos" className="mt-6">
          <RealApprovedVideosSection loading={loading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="rejected-videos" className="mt-6">
          <RealRejectedVideosSection loading={loading} onRefresh={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalsPage;
