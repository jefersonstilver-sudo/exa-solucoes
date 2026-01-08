
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
import FinanceiroCompleto from '@/pages/admin/FinanceiroCompleto';
import ZApiDiagnostics from '@/pages/admin/ZApiDiagnostics';
import AssinaturasPage from '@/pages/admin/AssinaturasPage';
import EmailLogs from '@/pages/admin/EmailLogs';
import LogosAdmin from '@/components/admin/LogosAdmin';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import SyncNotionPage from '@/pages/admin/SyncNotionPage';
import AgendaPage from '@/pages/admin/AgendaPage';
import ProdutosPage from '@/pages/admin/ProdutosPage';
import PropostasPage from '@/pages/admin/proposals/PropostasPage';
import NovaPropostaPage from '@/pages/admin/proposals/NovaPropostaPage';
import PropostaDetalhesPage from '@/pages/admin/proposals/PropostaDetalhesPage';
import ContratosPage from '@/pages/admin/contracts/ContratosPage';
import NovoContratoPage from '@/pages/admin/contracts/NovoContratoPage';
import NovoContratoSindicoPage from '@/pages/admin/contracts/NovoContratoSindicoPage';
import ContratoDetalhesPage from '@/pages/admin/contracts/ContratoDetalhesPage';
import PosicoesDisponiveisPage from '@/pages/admin/PosicoesDisponiveisPage';

// Lazy imports para páginas do monitoramento-ia (integradas)
const CRMUnificado = lazy(() => import('@/modules/monitoramento-ia/pages/CRMUnificado'));
const EscalacoesComerciais = lazy(() => import('@/modules/monitoramento-ia/pages/EscalacoesComerciais'));
const Agentes = lazy(() => import('@/modules/monitoramento-ia/pages/Agentes').then(m => ({ default: m.Agentes })));
const AlertasPage = lazy(() => import('@/modules/monitoramento-ia/pages/Alertas').then(m => ({ default: m.AlertasPage })));
const PaineisPage = lazy(() => import('@/modules/monitoramento-ia/pages/Paineis').then(m => ({ default: m.PaineisPage })));
const AgentKnowledge = lazy(() => import('@/modules/monitoramento-ia/pages/agents/AgentKnowledge').then(m => ({ default: m.AgentKnowledge })));

// Lazy imports para Contatos & Inteligência Comercial
// Lazy imports para Contatos & Inteligência Comercial
const ContatosPage = lazy(() => import('@/pages/admin/contatos/ContatosPage'));
const ContatosKanbanPage = lazy(() => import('@/pages/admin/contatos/ContatosKanbanPage'));
const ContatoDetalhePage = lazy(() => import('@/pages/admin/contatos/ContatoDetalhePage'));
const NovoContatoPage = lazy(() => import('@/pages/admin/contatos/NovoContatoPage'));
const PontuacaoConfigPage = lazy(() => import('@/pages/admin/contatos/PontuacaoConfigPage'));
const BloqueiosPage = lazy(() => import('@/pages/admin/contatos/BloqueiosPage'));
const ContactsLogsPage = lazy(() => import('@/pages/admin/contatos/ContactsLogsPage'));
const CRMHubPage = lazy(() => import('@/pages/admin/crm/CRMHubPage'));

// Lazy import para Vendas (FASE 2)
const VendasPage = lazy(() => import('@/pages/admin/vendas/VendasPage'));

// Lazy import para Financeiro (FASE 3)
const FinanceiroDashboard = lazy(() => import('@/pages/admin/financeiro/FinanceiroDashboard'));

// Lazy import para Central de Tarefas (FASE 3)
const MinhaManha = lazy(() => import('@/pages/admin/tarefas/MinhaManha'));

// Lazy imports para Processos & Operação
const ProcessosPage = lazy(() => import('@/pages/admin/processos/ProcessosPage'));
const DepartmentProcessesPage = lazy(() => import('@/pages/admin/processos/DepartmentProcessesPage'));
const ProcessEditorPage = lazy(() => import('@/pages/admin/processos/ProcessEditorPage'));

const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={<Dashboard />} />
      <Route path="minha-manha" element={<Suspense fallback={<GlobalLoadingPage />}><MinhaManha /></Suspense>} />
      <Route path="posicoes" element={<PosicoesDisponiveisPage />} />
      <Route path="sync-notion" element={<SyncNotionPage />} />
      <Route path="agenda" element={<AgendaPage />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="produtos" element={<ProdutosPage />} />
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
      <Route path="financeiro-mp" element={<FinanceiroCompleto />} />
      <Route path="financeiro" element={<Suspense fallback={<GlobalLoadingPage />}><FinanceiroDashboard /></Suspense>} />
      
      {/* ============ CRM ============ */}
      <Route path="crm-hub" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Hub..." />}>
          <CRMHubPage />
        </Suspense>
      } />
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
      
      {/* ============ CONTATOS & INTELIGÊNCIA COMERCIAL ============ */}
      <Route path="contatos" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Contatos..." />}>
          <ContatosPage />
        </Suspense>
      } />
      <Route path="contatos-kanban" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Kanban..." />}>
          <ContatosKanbanPage />
        </Suspense>
      } />
      <Route path="contatos/novo" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Formulário..." />}>
          <NovoContatoPage />
        </Suspense>
      } />
      <Route path="contatos/configuracoes/pontuacao" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Configurações..." />}>
          <PontuacaoConfigPage />
        </Suspense>
      } />
      <Route path="contatos/bloqueios" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Bloqueios..." />}>
          <BloqueiosPage />
        </Suspense>
      } />
      <Route path="contatos/logs" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Logs..." />}>
          <ContactsLogsPage />
        </Suspense>
      } />
      <Route path="contatos/:id" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Contato..." />}>
          <ContatoDetalhePage />
        </Suspense>
      } />
      
      {/* ============ PROCESSOS & OPERAÇÃO ============ */}
      <Route path="processos" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Processos..." />}>
          <ProcessosPage />
        </Suspense>
      } />
      <Route path="processos/:departmentId" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Processos..." />}>
          <DepartmentProcessesPage />
        </Suspense>
      } />
      <Route path="processos/:departmentId/:processId" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Editor..." />}>
          <ProcessEditorPage />
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
      
      {/* ============ VENDAS (FASE 2) ============ */}
      <Route path="vendas" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Vendas..." />}>
          <VendasPage />
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
