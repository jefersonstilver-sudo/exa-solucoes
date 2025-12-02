
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsManagement from '@/pages/admin/BuildingsManagement';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import SindicosInteressados from '@/pages/admin/SindicosInteressados';
import CouponsPage from '@/pages/admin/CouponsPage';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import ComunicacoesPage from '@/pages/admin/ComunicacoesPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import VideosSitePage from '@/pages/admin/VideosSitePage';
import LeadsExa from '@/pages/admin/LeadsExa';
import LogosAdmin from '@/components/admin/LogosAdmin';
import ProviderBenefits from '@/pages/admin/ProviderBenefits';
import PaineisExa from '@/pages/admin/PaineisExa';
import BenefitPurchaseInstructions from '@/pages/admin/BenefitPurchaseInstructions';
import BenefitManagement from '@/pages/admin/BenefitManagement';
import FinancialReports from '@/pages/admin/FinancialReports';
import EmailLogs from '@/pages/admin/EmailLogs';
import AssinaturasPage from '@/pages/admin/AssinaturasPage';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

// Lazy imports para páginas do monitoramento-ia (agora integradas)
const CRMUnificado = lazy(() => import('@/modules/monitoramento-ia/pages/CRMUnificado'));
const EscalacoesComerciais = lazy(() => import('@/modules/monitoramento-ia/pages/EscalacoesComerciais'));
const Agentes = lazy(() => import('@/modules/monitoramento-ia/pages/Agentes').then(m => ({ default: m.Agentes })));
const AlertasPage = lazy(() => import('@/modules/monitoramento-ia/pages/Alertas').then(m => ({ default: m.AlertasPage })));
const PaineisPage = lazy(() => import('@/modules/monitoramento-ia/pages/Paineis').then(m => ({ default: m.PaineisPage })));
const AgentKnowledge = lazy(() => import('@/modules/monitoramento-ia/pages/agents/AgentKnowledge').then(m => ({ default: m.AgentKnowledge })));
const CRMClients = lazy(() => import('@/pages/admin/CRMClients'));

const AdminRoutes = () => {
  const { userInfo } = useUserPermissions();
  
  return (
    <Routes>
      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={<Dashboard />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="assinaturas" element={<AssinaturasPage />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="instrucoes-compra-vales" element={<BenefitPurchaseInstructions />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      
      {/* ============ CRM ============ */}
      <Route path="crm" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando CRM..." />}>
          <CRMClients />
        </Suspense>
      } />
      <Route path="crm-chat" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Chat..." />}>
          <CRMUnificado />
        </Suspense>
      } />
      <Route path="escalacoes" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Escalações..." />}>
          <EscalacoesComerciais />
        </Suspense>
      } />
      
      {/* ============ INTELIGÊNCIA ============ */}
      <Route path="agentes-sofia" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Agentes..." />}>
          <Agentes />
        </Suspense>
      } />
      <Route path="agentes-sofia/:id/base-conhecimento" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Base de Conhecimento..." />}>
          <AgentKnowledge />
        </Suspense>
      } />
      <Route path="exa-alerts" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando EXA Alerts..." />}>
          <AlertasPage />
        </Suspense>
      } />
      
      {/* ============ ATIVOS ============ */}
      <Route path="predios" element={<BuildingsManagement />} />
      <Route path="paineis-exa" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Painéis EXA..." />}>
          <PaineisPage />
        </Suspense>
      } />
      
      {/* ============ LEADS & CLIENTES ============ */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-exa" element={<LeadsExa />} />
      
      {/* ============ CONTEÚDO ============ */}
      <Route path="videos" element={<VideoManagement />} />
      <Route path="videos-site" element={<VideosSitePage />} />
      <Route path="ticker" element={<LogosAdmin />} />
      {(userInfo.role === 'admin_marketing' || userInfo.role === 'admin' || userInfo.role === 'super_admin') && (
        <Route path="logos" element={<LogosAdmin />} />
      )}
      {(userInfo.role === 'admin_marketing' || userInfo.role === 'admin') && (
        <Route path="homepage-config" element={<HomepageImagesPage />} />
      )}
      <Route path="comunicacoes" element={<ComunicacoesPage />} />
      <Route path="email-logs" element={<EmailLogs />} />
      
      {/* ============ SISTEMA ============ */}
      <Route path="notificacoes" element={<NotificationsPage />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      
      {/* ============ REDIRECTS (rotas antigas) ============ */}
      <Route path="monitoramento-ia" element={<Navigate to="/admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="monitoramento-ia/paineis" element={<Navigate to="/admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/crm" element={<Navigate to="/admin/crm-chat" replace />} />
      <Route path="monitoramento-ia/agentes" element={<Navigate to="/admin/agentes-sofia" replace />} />
      <Route path="monitoramento-ia/alertas" element={<Navigate to="/admin/exa-alerts" replace />} />
      <Route path="monitoramento-ia/escalacoes" element={<Navigate to="/admin/escalacoes" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
