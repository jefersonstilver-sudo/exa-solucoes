
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRealApprovalsData } from '@/hooks/useRealApprovalsData';
import RealPaidOrdersSection from '@/components/admin/approvals/RealPaidOrdersSection';
import RealPendingVideosSection from '@/components/admin/approvals/RealPendingVideosSection';
import RealApprovedVideosSection from '@/components/admin/approvals/RealApprovedVideosSection';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending-orders');
  const { stats, loading, refetch } = useRealApprovalsData();

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Video className="h-8 w-8 mr-3 text-[#00FFAB]" />
            Sistema de Aprovações de Vídeos
          </h1>
          <p className="text-slate-300 mt-2">
            Gestão completa de vídeos enviados pelos clientes - Conformidade CONAR
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-[#00FFAB]/20 to-[#00FFAB]/10 border-[#00FFAB]/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-[#00FFAB]" />
              <div>
                <h3 className="font-semibold text-white">Aguardando Vídeo</h3>
                <p className="text-2xl font-bold text-[#00FFAB]">
                  {stats.paidWithoutVideo}
                </p>
                <p className="text-slate-300 text-sm">pedidos pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3C1361]/30 to-[#3C1361]/20 border-[#3C1361]/40">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-[#00FFAB]" />
              <div>
                <h3 className="font-semibold text-white">Para Aprovação</h3>
                <p className="text-2xl font-bold text-[#00FFAB]">
                  {stats.pendingApproval}
                </p>
                <p className="text-slate-300 text-sm">vídeos enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#00FFAB]/20 to-[#00FFAB]/10 border-[#00FFAB]/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-[#00FFAB]" />
              <div>
                <h3 className="font-semibold text-white">Aprovados</h3>
                <p className="text-2xl font-bold text-[#00FFAB]">
                  {stats.approved}
                </p>
                <p className="text-slate-300 text-sm">vídeos ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700/50 to-slate-600/30 border-slate-600/40">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-slate-400" />
              <div>
                <h3 className="font-semibold text-white">Rejeitados</h3>
                <p className="text-2xl font-bold text-slate-300">
                  {stats.rejected}
                </p>
                <p className="text-slate-400 text-sm">vídeos rejeitados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Separação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger 
            value="pending-orders" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-[#3C1361] text-slate-300"
          >
            <Clock className="h-4 w-4" />
            <span>Aguardando Vídeo ({stats.paidWithoutVideo})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending-videos" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-[#3C1361] text-slate-300"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Para Aprovação ({stats.pendingApproval})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approved-videos" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-[#3C1361] text-slate-300"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Aprovados ({stats.approved})</span>
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
      </Tabs>
    </div>
  );
};

export default ApprovalsPage;
