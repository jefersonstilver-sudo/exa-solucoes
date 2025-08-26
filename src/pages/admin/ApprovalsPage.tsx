import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRealApprovalsData } from '@/hooks/useRealApprovalsData';
import RealPaidOrdersSection from '@/components/admin/approvals/RealPaidOrdersSection';
import RealPendingVideosSection from '@/components/admin/approvals/RealPendingVideosSection';
import RealApprovedVideosSection from '@/components/admin/approvals/RealApprovedVideosSection';
import RealRejectedVideosSection from '@/components/admin/approvals/RealRejectedVideosSection';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending-orders');
  const { stats, loading, refetch } = useRealApprovalsData();

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center">
            <Video className="h-8 w-8 mr-3 text-[#FF6B35]" />
            Sistema de Aprovações de Vídeos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestão completa de vídeos enviados pelos clientes - Conformidade CONAR
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-200 to-blue-100 border-blue-300">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-black">Aguardando Vídeo</h3>
                <p className="text-2xl font-bold text-blue-800">
                  {stats.paidWithoutVideo}
                </p>
                <p className="text-gray-600 text-sm">pedidos pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-black">Para Aprovação</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingApproval}
                </p>
                <p className="text-gray-600 text-sm">vídeos enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-black">Aprovados</h3>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
                <p className="text-gray-600 text-sm">vídeos ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-100 to-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-black">Rejeitados</h3>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
                <p className="text-gray-600 text-sm">vídeos rejeitados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Separação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 border border-gray-200">
          <TabsTrigger 
            value="pending-orders" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-black text-gray-600"
          >
            <Clock className="h-4 w-4" />
            <span>Aguardando Vídeo ({stats.paidWithoutVideo})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pending-videos" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-black text-gray-600"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Para Aprovação ({stats.pendingApproval})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approved-videos" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-black text-gray-600"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Aprovados ({stats.approved})</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected-videos" 
            className="flex items-center space-x-2 data-[state=active]:bg-[#00FFAB] data-[state=active]:text-black text-gray-600"
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
