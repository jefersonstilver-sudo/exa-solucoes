import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsManagement3 from '@/pages/admin/BuildingsManagement3';
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
import ProdutosPage from '@/pages/admin/ProdutosPage';
import PropostasPage from '@/pages/admin/proposals/PropostasPage';
import NovaPropostaPage from '@/pages/admin/proposals/NovaPropostaPage';
import PropostaDetalhesPage from '@/pages/admin/proposals/PropostaDetalhesPage';
import ContratosPage from '@/pages/admin/contracts/ContratosPage';
import NovoContratoPage from '@/pages/admin/contracts/NovoContratoPage';
import NovoContratoSindicoPage from '@/pages/admin/contracts/NovoContratoSindicoPage';
import ContratoDetalhesPage from '@/pages/admin/contracts/ContratoDetalhesPage';
import SyncNotionPage from '@/pages/admin/SyncNotionPage';
import AgendaPage from '@/pages/admin/AgendaPage';
import UsersPage from '@/pages/admin/UsersPage';
import TiposContaPage from '@/pages/admin/TiposContaPage';
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import SecurityPage from '@/pages/admin/SecurityPage';
import AcessoNegadoPage from '@/pages/admin/AcessoNegadoPage';
import PosicoesDisponiveisPage from '@/pages/admin/PosicoesDisponiveisPage';
import ProtectedModuleRoute from '@/components/admin/ProtectedModuleRoute';
import { MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

// Lazy load editor video control page
const EditorVideoControlePage = lazy(() => import('@/pages/video-editor/VideoEditorAccessControl'));

// Sofia Executive Dashboard
const SofiaExecutive = lazy(() => import('@/pages/admin/SofiaExecutive'));

// Processos & Operação
const ProcessosPage = lazy(() => import('@/pages/admin/processos/ProcessosPage'));
const DepartmentProcessesPage = lazy(() => import('@/pages/admin/processos/DepartmentProcessesPage'));
const ProcessEditorPage = lazy(() => import('@/pages/admin/processos/ProcessEditorPage'));
const GestaoTempoPage = lazy(() => import('@/pages/admin/gestao-tempo/GestaoTempoPage'));

// Contatos
const ContatosPage = lazy(() => import('@/pages/admin/contatos/ContatosPage'));
const ContatosKanbanPage = lazy(() => import('@/pages/admin/contatos/ContatosKanbanPage'));
const ContatoDetalhePage = lazy(() => import('@/pages/admin/contatos/ContatoDetalhePage'));
const NovoContatoPage = lazy(() => import('@/pages/admin/contatos/NovoContatoPage'));
const PontuacaoConfigPage = lazy(() => import('@/pages/admin/contatos/PontuacaoConfigPage'));
const BloqueiosPage = lazy(() => import('@/pages/admin/contatos/BloqueiosPage'));
const ContactsLogsPage = lazy(() => import('@/pages/admin/contatos/ContactsLogsPage'));

// Financeiro
const CategoriasFinanceirasPage = lazy(() => import('@/pages/admin/financeiro/CategoriasFinanceirasPage'));

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
      <Route path="posicoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.posicoes}>
          <PosicoesDisponiveisPage />
        </ProtectedModuleRoute>
      } />
      <Route path="sync-notion" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.sync_notion}>
          <SyncNotionPage />
        </ProtectedModuleRoute>
      } />
      <Route path="agenda" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.agenda}>
          <AgendaPage />
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
      <Route path="produtos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.produtos}>
          <ProdutosPage />
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
      <Route path="propostas/:id/editar" element={
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
      <Route path="contatos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Contatos..." />}>
            <ContatosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos-kanban" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos_kanban}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Kanban..." />}>
            <ContatosKanbanPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos/novo" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Formulário..." />}>
            <NovoContatoPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos/:id" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Contato..." />}>
            <ContatoDetalhePage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos/configuracoes/pontuacao" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Configurações..." />}>
            <PontuacaoConfigPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos/bloqueios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Bloqueios..." />}>
            <BloqueiosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="contatos/logs" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.contatos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Logs..." />}>
            <ContactsLogsPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
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
      
      {/* ============ PROCESSOS & OPERAÇÃO ============ */}
      <Route path="processos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.processos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Processos..." />}>
            <ProcessosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="processos/:departmentId" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.processos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Processos..." />}>
            <DepartmentProcessesPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="processos/:departmentId/:processId" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.processos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Editor..." />}>
            <ProcessEditorPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />

      {/* ============ GESTÃO DE TEMPO ============ */}
      <Route path="gestao-tempo" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.gestao_tempo}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Gestão de Tempo..." />}>
            <GestaoTempoPage />
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
      <Route path="sofia-executive" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.agentes_sofia}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Sofia Executive..." />}>
            <SofiaExecutive />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ ATIVOS ============ */}
      <Route path="predios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.predios}>
          <BuildingsManagement3 />
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
      <Route path="usuarios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.usuarios}>
          <UsersPage />
        </ProtectedModuleRoute>
      } />
      <Route path="tipos-conta" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.usuarios}>
          <TiposContaPage />
        </ProtectedModuleRoute>
      } />
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
      <Route path="seguranca" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.seguranca}>
          <SecurityPage />
        </ProtectedModuleRoute>
      } />
      <Route path="configuracoes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.configuracoes}>
          <ConfiguracoesPage />
        </ProtectedModuleRoute>
      } />
      <Route path="editor-video-controle" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.editor_videos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Editor..." />}>
            <EditorVideoControlePage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ FINANCEIRO ============ */}
      <Route path="financeiro/categorias" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Categorias..." />}>
            <CategoriasFinanceirasPage />
          </Suspense>
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
