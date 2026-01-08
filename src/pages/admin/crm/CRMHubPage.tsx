import React, { useState, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, LayoutGrid, MessageSquare, FileText, ShoppingBag } from 'lucide-react';
import { AppleTabs, AppleTabsList, AppleTabsTrigger, AppleTabsContent } from '@/design-system/components/AppleTabs';
import { useCRMHub } from '@/hooks/crm/useCRMHub';
import { CRMHubFilters } from '@/types/crm';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

// Lazy load das abas para performance
const VisaoGeralTab = lazy(() => import('./components/tabs/VisaoGeralTab'));
const KanbanTab = lazy(() => import('./components/tabs/KanbanTab'));
const ChatTab = lazy(() => import('./components/tabs/ChatTab'));
const PropostasTab = lazy(() => import('./components/tabs/PropostasTab'));
const PedidosTab = lazy(() => import('./components/tabs/PedidosTab'));

const CRMHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [filters, setFilters] = useState<CRMHubFilters>({});
  
  const { clients, loading, metrics, funilColumns, updateFunilStatus, fetchClients } = useCRMHub(filters);

  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: Users },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'propostas', label: 'Propostas', icon: FileText },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  ];

  return (
    <>
      <Helmet>
        <title>CRM Hub | EXA Admin</title>
        <meta name="description" content="Central de relacionamento unificado - Gerencie todos os contatos, leads e clientes em um só lugar" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                CRM Hub
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Central de relacionamento unificado
              </p>
            </div>

            {/* Métricas resumidas */}
            <div className="flex items-center gap-3 md:gap-6">
              <MetricBadge label="Total" value={metrics.totalContatos} color="gray" />
              <MetricBadge label="Leads" value={metrics.leads} color="blue" />
              <MetricBadge label="Oportunidades" value={metrics.oportunidades} color="amber" />
              <MetricBadge label="Clientes" value={metrics.clientes} color="emerald" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-4 md:p-6">
          <AppleTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              <AppleTabsList className="inline-flex md:flex w-max md:w-auto gap-1">
                {tabs.map((tab) => (
                  <AppleTabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </AppleTabsTrigger>
                ))}
              </AppleTabsList>
            </div>

            <div className="mt-6">
              <Suspense fallback={<GlobalLoadingPage message="Carregando..." />}>
                <AppleTabsContent value="visao-geral">
                  <VisaoGeralTab 
                    clients={clients} 
                    loading={loading}
                    filters={filters}
                    setFilters={setFilters}
                    onRefresh={fetchClients}
                  />
                </AppleTabsContent>

                <AppleTabsContent value="kanban">
                  <KanbanTab 
                    clients={clients}
                    funilColumns={funilColumns}
                    loading={loading}
                    onUpdateStatus={updateFunilStatus}
                  />
                </AppleTabsContent>

                <AppleTabsContent value="chat">
                  <ChatTab />
                </AppleTabsContent>

                <AppleTabsContent value="propostas">
                  <PropostasTab clients={clients} />
                </AppleTabsContent>

                <AppleTabsContent value="pedidos">
                  <PedidosTab clients={clients} />
                </AppleTabsContent>
              </Suspense>
            </div>
          </AppleTabs>
        </div>
      </div>
    </>
  );
};

// Componente de métrica compacta
const MetricBadge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg md:text-xl font-bold px-3 py-1 rounded-full ${colorClasses[color]}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-1 hidden md:block">{label}</span>
    </div>
  );
};

export default CRMHubPage;
