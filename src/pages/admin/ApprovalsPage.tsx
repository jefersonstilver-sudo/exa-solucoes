import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRealApprovalsData } from '@/hooks/useRealApprovalsData';
import RealPaidOrdersSection from '@/components/admin/approvals/RealPaidOrdersSection';
import RealPendingVideosSection from '@/components/admin/approvals/RealPendingVideosSection';
import RealApprovedVideosSection from '@/components/admin/approvals/RealApprovedVideosSection';
import RealRejectedVideosSection from '@/components/admin/approvals/RealRejectedVideosSection';
import AdminPeriodSelector, { PeriodType, getPeriodDates } from '@/components/admin/common/AdminPeriodSelector';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending-orders');
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

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

      {/* Tabs para Separação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger 
            value="pending-orders" 
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Aguardando Vídeo ({stats.paidWithoutVideo})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending-videos" 
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Para Aprovação ({stats.pendingApproval})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approved-videos" 
            className="flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Aprovados ({stats.approved})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected-videos" 
            className="flex items-center space-x-2"
          >
            <XCircle className="h-4 w-4" />
            <span>Rejeitados ({stats.rejected})</span>
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
