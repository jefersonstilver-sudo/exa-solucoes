
import { Routes, Route } from 'react-router-dom';
import Dashboard from '@/pages/admin/Dashboard';
import BuildingsManagement from '@/pages/admin/BuildingsManagement';
import PanelsPage from '@/pages/admin/PanelsPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import OrderDetails from '@/pages/admin/OrderDetails';
import ApprovalsPage from '@/pages/admin/ApprovalsPage';
import UsersPage from '@/pages/admin/UsersPage';
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
import PaineisExa from '@/pages/admin/PaineisExa';
import LogosPage from '@/pages/admin/LogosPage';
import ProviderBenefits from '@/pages/admin/ProviderBenefits';
import BenefitPurchaseInstructions from '@/pages/admin/BenefitPurchaseInstructions';
import BenefitManagement from '@/pages/admin/BenefitManagement';
import CRMClients from '@/pages/admin/CRMClients';
import SecurityDashboard from '@/pages/admin/SecurityDashboard';
import FinancialReports from '@/pages/admin/FinancialReports';
import ZApiDiagnostics from '@/pages/admin/ZApiDiagnostics';
import AssinaturasPage from '@/pages/admin/AssinaturasPage';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* GESTÃO PRINCIPAL */}
      <Route index element={<Dashboard />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="assinaturas" element={<AssinaturasPage />} />
      <Route path="crm" element={<CRMClients />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="instrucoes-compra-vales" element={<BenefitPurchaseInstructions />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      
      {/* ATIVOS */}
      <Route path="predios" element={<BuildingsManagement />} />
      <Route path="paineis" element={<PanelsPage />} />
      <Route path="paineis-exa" element={<PaineisExa />} />
      
      {/* LEADS & CLIENTES */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-exa" element={<LeadsExa />} />
      
      {/* SISTEMA */}
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="homepage-config" element={<HomepageImagesPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="seguranca" element={<SecurityDashboard />} />
      <Route path="zapi-diagnostico" element={<ZApiDiagnostics />} />
      
      {/* CONTEÚDO */}
      <Route path="videos" element={<VideoManagement />} />
      <Route path="videos-site" element={<VideosSitePage />} />
      <Route path="editor-video-controle" element={<VideoEditorAccessControl />} />
      <Route path="logos" element={<LogosPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
      <Route path="comunicacoes" element={<ComunicacoesPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
