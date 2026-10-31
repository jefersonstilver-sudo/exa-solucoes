
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const BuildingsManagement3 = lazy(() => import('@/pages/admin/BuildingsManagement3'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const OrderDetails = lazy(() => import('@/pages/admin/OrderDetails'));
const ApprovalsPage = lazy(() => import('@/pages/admin/ApprovalsPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const CRM360Page = lazy(() => import('@/pages/admin/crm/CRM360Page'));
const ConsolidacaoPage = lazy(() => import('@/pages/admin/crm/ConsolidacaoPage'));
const TiposContaPage = lazy(() => import('@/pages/admin/TiposContaPage'));
const SindicosInteressados = lazy(() => import('@/pages/admin/SindicosInteressados'));
const CouponsPage = lazy(() => import('@/pages/admin/CouponsPage'));
const HomepageImagesPage = lazy(() => import('@/pages/admin/HomepageImagesPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const ComunicacoesPage = lazy(() => import('@/pages/admin/ComunicacoesPage'));
const ConfiguracoesPage = lazy(() => import('@/pages/admin/ConfiguracoesPage'));
const VideoManagement = lazy(() => import('@/pages/admin/VideoManagement'));
const VideosSitePage = lazy(() => import('@/pages/admin/VideosSitePage'));
const VideoEditorAccessControl = lazy(() => import('@/pages/video-editor/VideoEditorAccessControl'));
const LeadsExa = lazy(() => import('@/pages/admin/LeadsExa'));
const LogosPage = lazy(() => import('@/pages/admin/LogosPage'));
const ProviderBenefits = lazy(() => import('@/pages/admin/ProviderBenefits'));
const BenefitPurchaseInstructions = lazy(() => import('@/pages/admin/BenefitPurchaseInstructions'));
const BenefitManagement = lazy(() => import('@/pages/admin/BenefitManagement'));
const CRMClients = lazy(() => import('@/pages/admin/CRMClients'));
const SecurityDashboard = lazy(() => import('@/pages/admin/SecurityDashboard'));
const FinancialReports = lazy(() => import('@/pages/admin/FinancialReports'));
const ZApiDiagnostics = lazy(() => import('@/pages/admin/ZApiDiagnostics'));
const AssinaturasPage = lazy(() => import('@/pages/admin/AssinaturasPage'));
const EmailLogs = lazy(() => import('@/pages/admin/EmailLogs'));
const FormulariosSindicosPage = lazy(() => import('@/pages/admin/FormulariosSindicosPage'));
const LogosAdmin = lazy(() => import('@/components/admin/LogosAdmin'));
import GlobalLoadingPage from '@/components/loading/CarregandoConteudo';
const QrScansAdminPage = lazy(() => import('@/pages/admin/QrScansAdminPage'));
const SyncNotionPage = lazy(() => import('@/pages/admin/SyncNotionPage'));
const AgendaPage = lazy(() => import('@/pages/admin/AgendaPage'));
const ProdutosPage = lazy(() => import('@/pages/admin/ProdutosPage'));
const PropostasPage = lazy(() => import('@/pages/admin/proposals/PropostasPage'));
const NovaPropostaPage = lazy(() => import('@/pages/admin/proposals/NovaPropostaPage'));
const PropostaDetalhesPage = lazy(() => import('@/pages/admin/proposals/PropostaDetalhesPage'));
const ContratosPage = lazy(() => import('@/pages/admin/contracts/ContratosPage'));
const NovoContratoPage = lazy(() => import('@/pages/admin/contracts/NovoContratoPage'));
const NovoContratoSindicoPage = lazy(() => import('@/pages/admin/contracts/NovoContratoSindicoPage'));
const ContratoDetalhesPage = lazy(() => import('@/pages/admin/contracts/ContratoDetalhesPage'));
const LegalFlowPage = lazy(() => import('@/pages/admin/contracts/LegalFlowPage'));
const JuridicoWorkspacePage = lazy(() => import('@/pages/admin/contracts/JuridicoWorkspacePage'));
const PosicoesDisponiveisPage = lazy(() => import('@/pages/admin/PosicoesDisponiveisPage'));
const RelatorioPlaylistPage = lazy(() => import('@/pages/admin/RelatorioPlaylistPage'));

// Lazy imports para páginas do monitoramento-ia (integradas)
const EscalacoesComerciais = lazy(() => import('@/modules/monitoramento-ia/pages/EscalacoesComerciais'));
const Agentes = lazy(() => import('@/modules/monitoramento-ia/pages/Agentes').then(m => ({ default: m.Agentes })));
const AlertasPage = lazy(() => import('@/modules/monitoramento-ia/pages/Alertas').then(m => ({ default: m.AlertasPage })));
const EntregaTelasPage = lazy(() => import('@/pages/admin/EntregaTelasPage'));
const PaineisPage = lazy(() => import('@/modules/monitoramento-ia/pages/PaineisEXA'));
const TelasPage = lazy(() => import('@/modules/telas/TelasPage'));
const NandoConversaPage = lazy(() => import('@/pages/admin/nando/NandoConversaPage'));
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
const CRMEvolutionPage = lazy(() => import('@/pages/admin/crm/CRMEvolutionPage'));
const CRMConversationsPage = lazy(() => import('@/pages/admin/crm/CRMConversationsPage'));

// Lazy import para Vendas (FASE 2)
const VendasPage = lazy(() => import('@/pages/admin/vendas/VendasPage'));

// Lazy imports para Financeiro (100% ASAAS) - Dashboard V2 como principal
const FinanceiroDashboard = lazy(() => import('@/pages/admin/financeiro/DashboardFinanceiroV2'));
const FluxoCaixaPage = lazy(() => import('@/pages/admin/financeiro/FluxoCaixaPage'));
const LancamentosPage = lazy(() => import('@/pages/admin/financeiro/LancamentosPage'));
const ExtratoAsaasPage = lazy(() => import('@/pages/admin/financeiro/ExtratoAsaasPage'));
const InadimplenciaPage = lazy(() => import('@/pages/admin/financeiro/InadimplenciaPage'));
const ContasPagarPage = lazy(() => import('@/pages/admin/financeiro/ContasPagarPage'));
const ContasReceberPage = lazy(() => import('@/pages/admin/financeiro/ContasReceberPage'));
const DREPage = lazy(() => import('@/pages/admin/financeiro/DREPage'));
const InvestimentosPage = lazy(() => import('@/pages/admin/financeiro/InvestimentosPage'));
const AportesPage = lazy(() => import('@/pages/admin/financeiro/AportesPage'));
const AlertasFinanceirosPage = lazy(() => import('@/pages/admin/financeiro/AlertasFinanceirosPage'));
const RelatoriosFinanceirosPage = lazy(() => import('@/pages/admin/financeiro/RelatoriosFinanceirosPage'));
const CategoriasFinanceirasPage = lazy(() => import('@/pages/admin/financeiro/CategoriasFinanceirasPage'));

// Lazy import para Central de Tarefas (FASE 3 e 4.3)
const MinhaManha = lazy(() => import('@/pages/admin/tarefas/MinhaManha'));
const CentralTarefasPage = lazy(() => import('@/pages/admin/tarefas/CentralTarefasPage'));
const FullscreenAgendaPage = lazy(() => import('@/pages/admin/tarefas/FullscreenAgendaPage'));

// Lazy imports para Processos & Operação
const AdminProfileSettings = lazy(() => import('@/pages/admin/AdminProfileSettings'));
const ProcessosPage = lazy(() => import('@/pages/admin/processos/ProcessosPage'));
const DepartmentProcessesPage = lazy(() => import('@/pages/admin/processos/DepartmentProcessesPage'));
const ProcessEditorPage = lazy(() => import('@/pages/admin/processos/ProcessEditorPage'));
const AuditoriaImpersonacao = lazy(() => import('@/pages/super_admin/AuditoriaImpersonacao'));
const AdminMasterVideoConsole = lazy(() => import('@/pages/super_admin/AdminMasterVideoConsole'));

const SuperAdminRoutes = () => {
  return (
    <Suspense fallback={<GlobalLoadingPage />}>
    <Routes>
      {/* ============ GESTÃO PRINCIPAL ============ */}
      <Route index element={<Dashboard />} />
      <Route path="minha-manha" element={<Navigate to="/super_admin/tarefas" replace />} />
      <Route path="tarefas" element={<Suspense fallback={<GlobalLoadingPage />}><CentralTarefasPage /></Suspense>} />
      <Route path="tarefas/fullscreen" element={<Suspense fallback={<GlobalLoadingPage />}><FullscreenAgendaPage /></Suspense>} />
      <Route path="posicoes" element={<PosicoesDisponiveisPage />} />
      <Route path="sync-notion" element={<SyncNotionPage />} />
      <Route path="agenda" element={<Navigate to="/super_admin/tarefas" replace />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="qr-scans" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando scans..." />}>
          <QrScansAdminPage />
        </Suspense>
      } />
      <Route path="produtos" element={<ProdutosPage />} />
      <Route path="propostas" element={<PropostasPage />} />
      <Route path="propostas/nova" element={<NovaPropostaPage />} />
      <Route path="propostas/:id/editar" element={<NovaPropostaPage />} />
      <Route path="propostas/:id" element={<PropostaDetalhesPage />} />
      <Route path="juridico" element={<ContratosPage />} />
      <Route path="juridico/novo" element={<NovoContratoPage />} />
      <Route path="juridico/novo-sindico" element={<NovoContratoSindicoPage />} />
      <Route path="juridico/flow" element={<LegalFlowPage />} />
      <Route path="juridico/workspace" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Workspace..." />}>
          <JuridicoWorkspacePage />
        </Suspense>
      } />
      <Route path="juridico/:id" element={<ContratoDetalhesPage />} />
      <Route path="assinaturas" element={<AssinaturasPage />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="instrucoes-compra-vales" element={<BenefitPurchaseInstructions />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      <Route path="financeiro" element={<Suspense fallback={<GlobalLoadingPage />}><FinanceiroDashboard /></Suspense>} />
      <Route path="financeiro/contas-pagar" element={<Suspense fallback={<GlobalLoadingPage />}><ContasPagarPage /></Suspense>} />
      <Route path="financeiro/contas-receber" element={<Suspense fallback={<GlobalLoadingPage />}><ContasReceberPage /></Suspense>} />
      <Route path="financeiro/lancamentos" element={<Suspense fallback={<GlobalLoadingPage />}><LancamentosPage /></Suspense>} />
      <Route path="financeiro/extrato" element={<Suspense fallback={<GlobalLoadingPage />}><ExtratoAsaasPage /></Suspense>} />
      <Route path="financeiro/fluxo-caixa" element={<Suspense fallback={<GlobalLoadingPage />}><FluxoCaixaPage /></Suspense>} />
      <Route path="financeiro/dre" element={<Suspense fallback={<GlobalLoadingPage />}><DREPage /></Suspense>} />
      <Route path="financeiro/inadimplencia" element={<Suspense fallback={<GlobalLoadingPage />}><InadimplenciaPage /></Suspense>} />
      <Route path="financeiro/investimentos" element={<Suspense fallback={<GlobalLoadingPage />}><InvestimentosPage /></Suspense>} />
      <Route path="financeiro/aportes" element={<Suspense fallback={<GlobalLoadingPage />}><AportesPage /></Suspense>} />
      <Route path="financeiro/alertas" element={<Suspense fallback={<GlobalLoadingPage />}><AlertasFinanceirosPage /></Suspense>} />
      <Route path="financeiro/relatorios" element={<Suspense fallback={<GlobalLoadingPage />}><RelatoriosFinanceirosPage /></Suspense>} />
      <Route path="financeiro/categorias" element={<Suspense fallback={<GlobalLoadingPage />}><CategoriasFinanceirasPage /></Suspense>} />
      
      {/* ============ CRM ============ */}
      <Route path="crm-hub" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Hub..." />}>
          <CRMHubPage />
        </Suspense>
      } />
      <Route path="crm" element={<CRMClients />} />
      {/* CRM Chat antigo eliminado: tudo vai para o CRM Evolution */}
      <Route path="crm-chat" element={<Navigate to="/super_admin/crm-evolution" replace />} />
      <Route path="crm-evolution" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando CRM Evolution..." />}>
          <CRMEvolutionPage />
        </Suspense>
      } />
      <Route path="crm-evolution/conversas/:id" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando conversas..." />}>
          <CRMConversationsPage />
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
      <Route path="relatorio-playlist" element={
        <Suspense fallback={<GlobalLoadingPage message="Gerando relatório..." />}>
          <RelatorioPlaylistPage />
        </Suspense>
      } />
      <Route path="nando" element={<Suspense fallback={<GlobalLoadingPage message="Carregando Nando..." />}><NandoConversaPage /></Suspense>} />
      <Route path="telas" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando telas..." />}>
          <TelasPage />
        </Suspense>
      } />
      <Route path="paineis-exa" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando Painéis EXA..." />}>
          <PaineisPage />
        </Suspense>
      } />
      <Route path="entrega-telas" element={
        <Suspense fallback={<GlobalLoadingPage message="Carregando entrega nas telas..." />}>
          <EntregaTelasPage />
        </Suspense>
      } />
      
      {/* ============ LEADS & CLIENTES ============ */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="formularios-sindicos" element={<FormulariosSindicosPage />} />
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
      <Route path="usuarios" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
      <Route path="crm-360" element={<CRM360Page />} />
      <Route path="consolidacao" element={<ConsolidacaoPage />} />
      <Route path="tipos-conta" element={<TiposContaPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="seguranca" element={<SecurityDashboard />} />
      <Route path="auditoria-impersonacao" element={<Suspense fallback={<GlobalLoadingPage />}><AuditoriaImpersonacao /></Suspense>} />
      <Route path="admin-master-video" element={<Suspense fallback={<GlobalLoadingPage />}><AdminMasterVideoConsole /></Suspense>} />
      <Route path="zapi-diagnostico" element={<ZApiDiagnostics />} />
      
      {/* ============ MEU PERFIL ============ */}
      <Route path="meu-perfil" element={
        <Suspense fallback={<GlobalLoadingPage />}>
          <AdminProfileSettings />
        </Suspense>
      } />

      {/* ============ REDIRECTS (rotas antigas) ============ */}
      <Route path="monitoramento-ia" element={<Navigate to="/super_admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/dashboard" element={<Navigate to="/super_admin" replace />} />
      <Route path="monitoramento-ia/paineis" element={<Navigate to="/super_admin/paineis-exa" replace />} />
      <Route path="monitoramento-ia/crm" element={<Navigate to="/super_admin/crm-evolution" replace />} />
      <Route path="monitoramento-ia/agentes" element={<Navigate to="/super_admin/agentes-sofia" replace />} />
      <Route path="monitoramento-ia/alertas" element={<Navigate to="/super_admin/exa-alerts" replace />} />
      <Route path="monitoramento-ia/escalacoes" element={<Navigate to="/super_admin/escalacoes" replace />} />
    </Routes>
    </Suspense>
  );
};

export default SuperAdminRoutes;
