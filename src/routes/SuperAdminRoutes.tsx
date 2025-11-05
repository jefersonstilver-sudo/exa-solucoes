
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
import ConfiguracoesPage from '@/pages/admin/ConfiguracoesPage';
import VideoManagement from '@/pages/admin/VideoManagement';
import VideosSitePage from '@/pages/admin/VideosSitePage';
import LeadsProdutora from '@/pages/admin/LeadsProdutora';
import LeadsLinkae from '@/pages/admin/LeadsLinkae';
import LeadsExa from '@/pages/admin/LeadsExa';
import LogosPage from '@/pages/admin/LogosPage';
import ProviderBenefits from '@/pages/admin/ProviderBenefits';
import BenefitPreview from '@/pages/admin/BenefitPreview';
import BenefitManagement from '@/pages/admin/BenefitManagement';
import CRMClients from '@/pages/admin/CRMClients';
import SecurityDashboard from '@/pages/admin/SecurityDashboard';
import FinancialReports from '@/pages/admin/FinancialReports';

const SuperAdminRoutes = () => {
  return (
    <Routes>
      {/* GESTÃO PRINCIPAL */}
      <Route index element={<Dashboard />} />
      <Route path="pedidos" element={<OrdersPage />} />
      <Route path="pedidos/:id" element={<OrderDetails />} />
      <Route path="crm" element={<CRMClients />} />
      <Route path="aprovacoes" element={<ApprovalsPage />} />
      <Route path="beneficio-prestadores" element={<ProviderBenefits />} />
      <Route path="preview-beneficio" element={<BenefitPreview />} />
      <Route path="gerenciar-beneficios" element={<BenefitManagement />} />
      <Route path="relatorios-financeiros" element={<FinancialReports />} />
      
      {/* ATIVOS */}
      <Route path="predios" element={<BuildingsManagement />} />
      <Route path="paineis" element={<PanelsPage />} />
      
      {/* LEADS & CLIENTES */}
      <Route path="sindicos-interessados" element={<SindicosInteressados />} />
      <Route path="leads-produtora" element={<LeadsProdutora />} />
          <Route path="leads-linkae" element={<LeadsLinkae />} />
          <Route path="leads-exa" element={<LeadsExa />} />
      
      {/* SISTEMA */}
      <Route path="usuarios" element={<UsersPage />} />
      <Route path="cupons" element={<CouponsPage />} />
      <Route path="homepage-config" element={<HomepageImagesPage />} />
      <Route path="configuracoes" element={<ConfiguracoesPage />} />
      <Route path="seguranca" element={<SecurityDashboard />} />
      
      {/* CONTEÚDO */}
      <Route path="videos" element={<VideoManagement />} />
      <Route path="videos-site" element={<VideosSitePage />} />
      <Route path="logos" element={<LogosPage />} />
      <Route path="notificacoes" element={<NotificationsPage />} />
    </Routes>
  );
};

export default SuperAdminRoutes;
