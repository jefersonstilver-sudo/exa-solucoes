
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useApprovalsDataComplete } from '@/hooks/useApprovalsDataComplete';
import PaidOrdersSection from '@/components/admin/approvals/PaidOrdersSection';
import PendingVideosSection from '@/components/admin/approvals/PendingVideosSection';
import ApprovedVideosSection from '@/components/admin/approvals/ApprovedVideosSection';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending-orders');
  const { stats, loading, refetch } = useApprovalsDataComplete();

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Video className="h-8 w-8 mr-3 text-indexa-purple" />
            Sistema de Aprovações de Vídeos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestão completa de vídeos enviados pelos clientes - Conformidade CONAR
          </p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Aguardando Vídeo</h3>
                <p className="text-2xl font-bold text-orange-700">
                  {stats.paidWithoutVideo}
                </p>
                <p className="text-orange-600 text-sm">pedidos pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Para Aprovação</h3>
                <p className="text-2xl font-bold text-red-700">
                  {stats.pendingApproval}
                </p>
                <p className="text-red-600 text-sm">vídeos enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Aprovados</h3>
                <p className="text-2xl font-bold text-green-700">
                  {stats.approved}
                </p>
                <p className="text-green-600 text-sm">vídeos ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-6 w-6 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-800">Rejeitados</h3>
                <p className="text-2xl font-bold text-gray-700">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-orders" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Aguardando Vídeo ({stats.paidWithoutVideo})</span>
          </TabsTrigger>
          <TabsTrigger value="pending-videos" className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Para Aprovação ({stats.pendingApproval})</span>
          </TabsTrigger>
          <TabsTrigger value="approved-videos" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Aprovados Recentemente ({stats.approved})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-orders" className="mt-6">
          <PaidOrdersSection loading={loading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="pending-videos" className="mt-6">
          <PendingVideosSection loading={loading} onRefresh={refetch} />
        </TabsContent>

        <TabsContent value="approved-videos" className="mt-6">
          <ApprovedVideosSection loading={loading} onRefresh={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalsPage;
