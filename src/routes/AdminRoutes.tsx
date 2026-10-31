import React, { Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Routes, Route, Navigate } from 'react-router-dom';
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const BuildingsManagement3 = lazy(() => import('@/pages/admin/BuildingsManagement3'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const OrderDetails = lazy(() => import('@/pages/admin/OrderDetails'));
const ApprovalsPage = lazy(() => import('@/pages/admin/ApprovalsPage'));
const SindicosInteressados = lazy(() => import('@/pages/admin/SindicosInteressados'));
const FormulariosSindicosPage = lazy(() => import('@/pages/admin/FormulariosSindicosPage'));
const CouponsPage = lazy(() => import('@/pages/admin/CouponsPage'));
const HomepageImagesPage = lazy(() => import('@/pages/admin/HomepageImagesPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const ComunicacoesPage = lazy(() => import('@/pages/admin/ComunicacoesPage'));
const VideoManagement = lazy(() => import('@/pages/admin/VideoManagement'));
const VideosSitePage = lazy(() => import('@/pages/admin/VideosSitePage'));
const LeadsExa = lazy(() => import('@/pages/admin/LeadsExa'));
const LogosAdmin = lazy(() => import('@/components/admin/LogosAdmin'));
const ProviderBenefits = lazy(() => import('@/pages/admin/ProviderBenefits'));
const PaineisExa = lazy(() => import('@/pages/admin/PaineisExa'));
const BenefitPurchaseInstructions = lazy(() => import('@/pages/admin/BenefitPurchaseInstructions'));
const BenefitManagement = lazy(() => import('@/pages/admin/BenefitManagement'));
const FinancialReports = lazy(() => import('@/pages/admin/FinancialReports'));
const EmailLogs = lazy(() => import('@/pages/admin/EmailLogs'));
const AssinaturasPage = lazy(() => import('@/pages/admin/AssinaturasPage'));
const ProdutosPage = lazy(() => import('@/pages/admin/ProdutosPage'));
const PropostasPage = lazy(() => import('@/pages/admin/proposals/PropostasPage'));
const NovaPropostaPage = lazy(() => import('@/pages/admin/proposals/NovaPropostaPage'));
const PropostaDetalhesPage = lazy(() => import('@/pages/admin/proposals/PropostaDetalhesPage'));
const ContratosPage = lazy(() => import('@/pages/admin/contracts/ContratosPage'));
const NovoContratoPage = lazy(() => import('@/pages/admin/contracts/NovoContratoPage'));
const NovoContratoSindicoPage = lazy(() => import('@/pages/admin/contracts/NovoContratoSindicoPage'));
const ContratoDetalhesPage = lazy(() => import('@/pages/admin/contracts/ContratoDetalhesPage'));
const SyncNotionPage = lazy(() => import('@/pages/admin/SyncNotionPage'));
const AgendaPage = lazy(() => import('@/pages/admin/AgendaPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const CRM360Page = lazy(() => import('@/pages/admin/crm/CRM360Page'));
const ConsolidacaoPage = lazy(() => import('@/pages/admin/crm/ConsolidacaoPage'));
const TiposContaPage = lazy(() => import('@/pages/admin/TiposContaPage'));
const ConfiguracoesPage = lazy(() => import('@/pages/admin/ConfiguracoesPage'));
const SecurityPage = lazy(() => import('@/pages/admin/SecurityPage'));
const AcessoNegadoPage = lazy(() => import('@/pages/admin/AcessoNegadoPage'));
const PosicoesDisponiveisPage = lazy(() => import('@/pages/admin/PosicoesDisponiveisPage'));
const ProtectedModuleRoute = lazy(() => import('@/components/admin/ProtectedModuleRoute'));
import { MODULE_KEYS, MODULE_ROUTES, useDynamicModulePermissions } from '@/hooks/useDynamicModulePermissions';
import GlobalLoadingPage from '@/components/loading/CarregandoConteudo';

// Redirect inteligente: redireciona ao primeiro módulo permitido
const AdminIndexRedirect = () => {
  const { hasModuleAccess, isCEO, isLoading } = useDynamicModulePermissions();
  const { userProfile } = useAuth();
  
  if (isLoading) return <GlobalLoadingPage message="Verificando permissões..." />;
  if (isCEO) return <Dashboard />;
  
  // Se tem acesso ao dashboard, mostra ele
  if (hasModuleAccess('dashboard')) return <Dashboard />;
  
  // Departmental priority map for smart redirect
  const deptSlug = userProfile?.departamento?.name?.toLowerCase()
    ?.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    ?.replace(/[^a-z0-9]+/g, '_')
    ?.replace(/^_|_$/g, '') || null;

  const DEPT_PRIORITY: Record<string, string[]> = {
    comercial: ['propostas', 'pedidos', 'contatos', 'crm_hub', 'minha_manha', 'vendas', 'juridico'],
    marketing: ['leads', 'emails', 'videos_site', 'ticker', 'editor_videos', 'homepage_config'],
    financeiro: ['financeiro', 'relatorios', 'pedidos', 'assinaturas'],
    administrativo: ['dashboard', 'predios', 'paineis', 'usuarios', 'processos'],
    tecnologia: ['processos', 'configuracoes', 'seguranca'],
  };

  const priorityModules = deptSlug && DEPT_PRIORITY[deptSlug]
    ? DEPT_PRIORITY[deptSlug]
    : ['pedidos', 'propostas', 'contatos', 'crm_hub', 'predios', 'paineis',
       'aprovacoes', 'videos_anunciantes', 'beneficios', 'relatorios', 'financeiro',
       'leads', 'sindicos', 'emails', 'usuarios', 'agenda', 'processos'];
  
  for (const mod of priorityModules) {
    if (hasModuleAccess(mod) && MODULE_ROUTES[mod]) {
      return <Navigate to={MODULE_ROUTES[mod].path} replace />;
    }
  }
  
  // Fallback: meu perfil
  return <Navigate to="/admin/meu-perfil" replace />;
};

// Meu Perfil
const AdminProfileSettings = lazy(() => import('@/pages/admin/AdminProfileSettings'));

// Central de Tarefas
const CentralTarefasPage = lazy(() => import('@/pages/admin/tarefas/CentralTarefasPage'));
const FullscreenAgendaPage = lazy(() => import('@/pages/admin/tarefas/FullscreenAgendaPage'));

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
const FinanceiroDashboard = lazy(() => import('@/pages/admin/financeiro/DashboardFinanceiroV2'));
const ContasPagarPage = lazy(() => import('@/pages/admin/financeiro/ContasPagarPage'));
const ContasReceberPage = lazy(() => import('@/pages/admin/financeiro/ContasReceberPage'));
const LancamentosPage = lazy(() => import('@/pages/admin/financeiro/LancamentosPage'));
const ExtratoAsaasPage = lazy(() => import('@/pages/admin/financeiro/ExtratoAsaasPage'));
const FluxoCaixaPage = lazy(() => import('@/pages/admin/financeiro/FluxoCaixaPage'));
const DREPage = lazy(() => import('@/pages/admin/financeiro/DREPage'));
const InadimplenciaPage = lazy(() => import('@/pages/admin/financeiro/InadimplenciaPage'));
const InvestimentosPage = lazy(() => import('@/pages/admin/financeiro/InvestimentosPage'));
const AportesPage = lazy(() => import('@/pages/admin/financeiro/AportesPage'));
const AlertasFinanceirosPage = lazy(() => import('@/pages/admin/financeiro/AlertasFinanceirosPage'));
const RelatoriosFinanceirosPage = lazy(() => import('@/pages/admin/financeiro/RelatoriosFinanceirosPage'));
const VendasPage = lazy(() => import('@/pages/admin/vendas/VendasPage'));

// Lazy imports para páginas do monitoramento-ia (agora integradas)
const EscalacoesComerciais = lazy(() => import('@/modules/monitoramento-ia/pages/EscalacoesComerciais'));
const Agentes = lazy(() => import('@/modules/monitoramento-ia/pages/Agentes').then(m => ({ default: m.Agentes })));
const AlertasPage = lazy(() => import('@/modules/monitoramento-ia/pages/Alertas').then(m => ({ default: m.AlertasPage })));
const EntregaTelasPage = lazy(() => import('@/pages/admin/EntregaTelasPage'));
const PaineisPage = lazy(() => import('@/modules/monitoramento-ia/pages/PaineisEXA'));
const TelasPage = lazy(() => import('@/modules/telas/TelasPage'));
const NandoConversaPage = lazy(() => import('@/pages/admin/nando/NandoConversaPage'));
const AgentKnowledge = lazy(() => import('@/modules/monitoramento-ia/pages/agents/AgentKnowledge').then(m => ({ default: m.AgentKnowledge })));
const CRMClients = lazy(() => import('@/pages/admin/CRMClients'));
const CRMEvolutionPage = lazy(() => import('@/pages/admin/crm/CRMEvolutionPage'));
const CRMConversationsPage = lazy(() => import('@/pages/admin/crm/CRMConversationsPage'));
const RelatorioPlaylistPage = lazy(() => import('@/pages/admin/RelatorioPlaylistPage'));

const AdminRoutes = () => {
  return (
    <Suspense fallback={<GlobalLoadingPage />}>
    <Routes>
      {/* Access Denied Page */}
      <Route path="acesso-negado" element={<AcessoNegadoPage />} />

      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={<AdminIndexRedirect />} />
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
      {/* CRM Chat antigo eliminado: tudo vai para o CRM Evolution */}
      <Route path="crm-chat" element={<Navigate to="/admin/crm-evolution" replace />} />
      <Route path="crm-evolution" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.crm_evolution}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Evolution..." />}>
            <CRMEvolutionPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="crm-evolution/conversas/:id" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.crm_evolution}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando conversas..." />}>
            <CRMConversationsPage />
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
      <Route path="relatorio-playlist" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.predios}>
          <Suspense fallback={<GlobalLoadingPage message="Gerando relatório..." />}>
            <RelatorioPlaylistPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="nando" element={<ProtectedModuleRoute moduleKey={MODULE_KEYS.crm_evolution}><Suspense fallback={<GlobalLoadingPage message="Carregando Nando..." />}><NandoConversaPage /></Suspense></ProtectedModuleRoute>} />
      <Route path="telas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.paineis}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando telas..." />}>
            <TelasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="paineis-exa" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.paineis}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Painéis EXA..." />}>
            <PaineisPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="entrega-telas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.paineis}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando entrega nas telas..." />}>
            <EntregaTelasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ LEADS & CLIENTES ============ */}
      <Route path="sindicos-interessados" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.sindicos}>
          <SindicosInteressados />
        </ProtectedModuleRoute>
      } />
      <Route path="formularios-sindicos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.formularios_sindicos}>
          <FormulariosSindicosPage />
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
      <Route path="crm-360" element={<ProtectedModuleRoute moduleKey={MODULE_KEYS.usuarios}><CRM360Page /></ProtectedModuleRoute>} />
      <Route path="consolidacao" element={<ProtectedModuleRoute moduleKey={MODULE_KEYS.usuarios}><ConsolidacaoPage /></ProtectedModuleRoute>} />
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
      <Route path="financeiro" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <FinanceiroDashboard />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/contas-pagar" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <ContasPagarPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/contas-receber" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <ContasReceberPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/lancamentos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <LancamentosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/extrato" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <ExtratoAsaasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/fluxo-caixa" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <FluxoCaixaPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/dre" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <DREPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/inadimplencia" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <InadimplenciaPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/investimentos" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <InvestimentosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/aportes" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <AportesPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/alertas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <AlertasFinanceirosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/relatorios" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Financeiro..." />}>
            <RelatoriosFinanceirosPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="vendas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.pedidos}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Vendas..." />}>
            <VendasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="financeiro/categorias" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.financeiro}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Categorias..." />}>
            <CategoriasFinanceirasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      
      {/* ============ CENTRAL DE TAREFAS ============ */}
      <Route path="tarefas" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.minha_manha}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Tarefas..." />}>
            <CentralTarefasPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="tarefas/fullscreen" element={
        <ProtectedModuleRoute moduleKey={MODULE_KEYS.minha_manha}>
          <Suspense fallback={<GlobalLoadingPage message="Carregando Agenda..." />}>
            <FullscreenAgendaPage />
          </Suspense>
        </ProtectedModuleRoute>
      } />
      <Route path="minha-manha" element={<Navigate to="/admin/tarefas" replace />} />

      {/* ============ MEU PERFIL ============ */}
      <Route path="meu-perfil" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando perfil..." />}>
          <AdminProfileSettings />
        </Suspense>
      } />

      {/* ============ REDIRECTS (rotas antigas) ============ */}
      <Route path="monitoramento-ia" element={<Navigate to="/admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="monitoramento-ia/paineis" element={<Navigate to="/admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/crm" element={<Navigate to="/admin/crm-evolution" replace />} />
      <Route path="monitoramento-ia/agentes" element={<Navigate to="/admin/agentes-sofia" replace />} />
      <Route path="monitoramento-ia/alertas" element={<Navigate to="/admin/exa-alerts" replace />} />
      <Route path="monitoramento-ia/escalacoes" element={<Navigate to="/admin/escalacoes" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AdminRoutes;
