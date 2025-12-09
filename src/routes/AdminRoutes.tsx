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
import PropostasPage from '@/pages/admin/proposals/PropostasPage';
import NovaPropostaPage from '@/pages/admin/proposals/NovaPropostaPage';
import PropostaDetalhesPage from '@/pages/admin/proposals/PropostaDetalhesPage';
import ContratosPage from '@/pages/admin/contracts/ContratosPage';
import NovoContratoPage from '@/pages/admin/contracts/NovoContratoPage';
import NovoContratoSindicoPage from '@/pages/admin/contracts/NovoContratoSindicoPage';
import ContratoDetalhesPage from '@/pages/admin/contracts/ContratoDetalhesPage';
import SyncNotionPage from '@/pages/admin/SyncNotionPage';
import AcessoNegadoPage from '@/pages/admin/AcessoNegadoPage';
import ProtectedModuleRoute from '@/components/admin/ProtectedModuleRoute';
import { MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';
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
  return (
    <Routes>
      {/* Access Denied Page */}
      <Route path="acesso-negado" element={<AcessoNegadoPage />} />

      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.dashboard}>
          <Dashboard />
        </ProtectedModuleRoute>
      } />
      <Route path="sync-notion" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.sync_notion}>
          <SyncNotionPage />
        </ProtectedModuleRoute>
      } />
      <Route path="pedidos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.pedidos}>
          <OrdersPage />
        </ProtectedModuleRoute>
      } />
      <Route path="pedidos/:id" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.pedidos}>
          <OrderDetails />
        </ProtectedModuleRoute>
      } />
      <Route path="propostas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.propostas}>
          <PropostasPage />
        </ProtectedModuleRoute>
      } />
      <Route path="propostas/nova" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.propostas}>
          <NovaPropostaPage />
        </ProtectedModuleRoute>
      } />
      <Route path="propostas/:id" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.propostas}>
          <PropostaDetalhesPage />
        </ProtectedModuleRoute>
      } />
      <Route path="juridico" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.juridico}>
          <ContratosPage />
        </ProtectedModuleRoute>
      } />
      <Route path="juridico/novo" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.juridico}>
          <NovoContratoPage />
        </ProtectedModuleRoute>
      } />
      <Route path="juridico/novo-sindico" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.juridico}>
          <NovoContratoSindicoPage />
        </ProtectedModuleRoute>
      } />
      <Route path="juridico/:id" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.juridico}>
          <ContratoDetalhesPage />
        </ProtectedModuleRoute>
      } />
      <Route path="assinaturas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.assinaturas}>
          <AssinaturasPage />
        </ProtectedModuleRoute>
      } />
      <Route path="aprovacoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.aprovacoes}>
          <ApprovalsPage />
        </ProtectedModuleRoute>
      } />
      <Route path="cupons" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.cupons}>
          <CouponsPage />
        </ProtectedModuleRoute>
      } />
      <Route path="beneficio-prestadores" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.beneficios}>
          <ProviderBenefits />
        </ProtectedModuleRoute>
      } />
      <Route path="instrucoes-compra-vales" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.beneficios}>
          <BenefitPurchaseInstructions />
        </ProtectedModuleRoute>
      } />
      <Route path="gerenciar-beneficios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.beneficios}>
          <BenefitManagement />
        </ProtectedModuleRoute>
      } />
      
      {/* ============ CRM ============ */}
      <Route path="crm" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.crm_site}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando CRM..." />}>
            <CRMClients />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="crm-chat" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.crm_chat}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Chat..." />}>
            <CRMUnificado />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="escalacoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.escalacoes}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Escalações..." />}>
            <EscalacoesComerciais />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ INTELIGÊNCIA ============ */}
      <Route path="agentes-sofia" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.agentes_sofia}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Agentes..." />}>
            <Agentes />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="agentes-sofia/:id/base-conhecimento" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.agentes_sofia}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Base de Conhecimento..." />}>
            <AgentKnowledge />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="exa-alerts" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.exa_alerts}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando EXA Alerts..." />}>
            <AlertasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ ATIVOS ============ */}
      <Route path="predios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.predios}>
          <BuildingsManagement />
        </ProtectedModuleRoute>
      } />
      <Route path="paineis-exa" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.paineis}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Painéis EXA..." />}>
            <PaineisPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ LEADS & CLIENTES ============ */}
      <Route path="sindicos-interessados" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.sindicos}>
          <SindicosInteressados />
        </ProtectedModuleRoute>
      } />
      <Route path="leads-exa" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.leads}>
          <LeadsExa />
        </ProtectedModuleRoute>
      } />
      
      {/* ============ CONTEÚDO ============ */}
      <Route path="videos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.videos_anunciantes}>
          <VideoManagement />
        </ProtectedModuleRoute>
      } />
      <Route path="videos-site" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.videos_site}>
          <VideosSitePage />
        </ProtectedModuleRoute>
      } />
      <Route path="ticker" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.ticker}>
          <LogosAdmin />
        </ProtectedModuleRoute>
      } />
      <Route path="logos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.ticker}>
          <LogosAdmin />
        </ProtectedModuleRoute>
      } />
      <Route path="homepage-config" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.ticker}>
          <HomepageImagesPage />
        </ProtectedModuleRoute>
      } />
      <Route path="comunicacoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.emails}>
          <ComunicacoesPage />
        </ProtectedModuleRoute>
      } />
      <Route path="email-logs" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.emails}>
          <EmailLogs />
        </ProtectedModuleRoute>
      } />
      
      {/* ============ SISTEMA ============ */}
      <Route path="notificacoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.notificacoes}>
          <NotificationsPage />
        </ProtectedModuleRoute>
      } />
      <Route path="relatorios-financeiros" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.relatorios}>
          <FinancialReports />
        </ProtectedModuleRoute>
      } />
      
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
