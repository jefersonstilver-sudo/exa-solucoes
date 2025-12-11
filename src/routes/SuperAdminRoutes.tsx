
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsManagement3 from '@/pages/admin/BuildingsManagement3';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import UsersPage from '@/pages/admin/UsersPage';
import TiposContaPage from '@/pages/admin/TiposContaPage';
import SindicosInteressados from '@/pages/admin/SindicosInteressados';
import CouponsPage from '@/pages/admin/CouponsPage';
import HomepageImagesPage from '@/pages/admin/HomepageImagesPage';
import NotificationsPage from '@/pages/admin/NotificationsPage';
import ComunicacoesPage from '@/pages/admin/ComunicacoesPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import VideosSitePage from '@/pages/admin/VideosSitePage';
import VideoEditorAccessControl from '@/pages/video-editor/VideoEditorAccessControl';
import LeadsExa from '@/pages/admin/LeadsExa';
import LogosPage from '@/pages/admin/LogosPage';
import ProviderBenefits from '@/pages/admin/ProviderBenefits';
import BenefitPurchaseInstructions from '@/pages/admin/BenefitPurchaseInstructions';
import BenefitManagement from '@/pages/admin/BenefitManagement';
import CRMClients from '@/pages/admin/CRMClients';
import SecurityDashboard from '@/pages/admin/SecurityDashboard';
import FinancialReports from '@/pages/admin/FinancialReports';
import ZApiDiagnostics from '@/pages/admin/ZApiDiagnostics';
import AssinaturasPage from '@/pages/admin/AssinaturasPage';
import EmailLogs from '@/pages/admin/EmailLogs';
import LogosAdmin from '@/components/admin/LogosAdmin';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import SyncNotionPage from '@/pages/admin/SyncNotionPage';
import PropostasPage from '@/pages/admin/proposals/PropostasPage';
import NovaPropostaPage from '@/pages/admin/proposals/NovaPropostaPage';
import PropostaDetalhesPage from '@/pages/admin/proposals/PropostaDetalhesPage';
import ContratosPage from '@/pages/admin/contracts/ContratosPage';
import NovoContratoPage from '@/pages/admin/contracts/NovoContratoPage';
import NovoContratoSindicoPage from '@/pages/admin/contracts/NovoContratoSindicoPage';
import ContratoDetalhesPage from '@/pages/admin/contracts/ContratoDetalhesPage';

// Lazy imports para páginas do monitoramento-ia (integradas)
const CRMUnificado = lazy(() => import('@/modules/monitoramento-ia/pages/CRMUnificado'));
const EscalacoesComerciais = lazy(() => import('@/modules/monitoramento-ia/pages/EscalacoesComerciais'));
const Agentes = lazy(() => import('@/modules/monitoramento-ia/pages/Agentes').then(m => ({ default: m.Agentes })));
const AlertasPage = lazy(() => import('@/modules/monitoramento-ia/pages/Alertas').then(m => ({ default: m.AlertasPage })));
const PaineisPage = lazy(() => import('@/modules/monitoramento-ia/pages/Paineis').then(m => ({ default: m.PaineisPage })));
const AgentKnowledge = lazy(() => import('@/modules/monitoramento-ia/pages/agents/AgentKnowledge').then(m => ({ default: m.AgentKnowledge })));

const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={<Dashboard />} />
      <Route path="sync-notion" element={<SyncNotionPage />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="propostas" element={<PropostasPage />} />
      <Route path="propostas/nova" element={<NovaPropostaPage />} />
      <Route path="propostas/:id" element={<PropostaDetalhesPage />} />
      <Route path="juridico" element={<ContratosPage />} />
      <Route path="juridico/novo" element={<NovoContratoPage />} />
      <Route path="juridico/novo-sindico" element={<NovoContratoSindicoPage />} />
      <Route path="juridico/:id" element={<ContratoDetalhesPage />} />
      <Route path="assinaturas" element={<AssinaturasPage />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="instrucoes-compra-vales" element={<BenefitPurchaseInstructions />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      
      {/* ============ CRM ============ */}
      <Route path="crm" element={<CRMClients />} />
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
      <Route path="predios" element={<BuildingsManagement3 />} />
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
      <Route path="logos" element={<LogosPage />} />
      <Route path="editor-video-controle" element={<VideoEditorAccessControl />} />
      <Route path="homepage-config" element={<HomepageImagesPage />} />
      <Route path="comunicacoes" element={<ComunicacoesPage />} />
      <Route path="email-logs" element={<EmailLogs />} />
      
      {/* ============ SISTEMA ============ */}
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="tipos-conta" element={<TiposContaPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="seguranca" element={<SecurityDashboard />} />
      <Route path="zapi-diagnostico" element={<ZApiDiagnostics />} />
      
      {/* ============ REDIRECTS (rotas antigas) ============ */}
      <Route path="monitoramento-ia" element={<Navigate to="/super_admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/dashboard" element={<Navigate to="/super_admin" replace />} />
      <Route path="monitoramento-ia/paineis" element={<Navigate to="/super_admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/crm" element={<Navigate to="/super_admin/crm-chat" replace />} />
      <Route path="monitoramento-ia/agentes" element={<Navigate to="/super_admin/agentes-sofia" replace />} />
      <Route path="monitoramento-ia/alertas" element={<Navigate to="/super_admin/exa-alerts" replace />} />
      <Route path="monitoramento-ia/escalacoes" element={<Navigate to="/super_admin/escalacoes" replace />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
