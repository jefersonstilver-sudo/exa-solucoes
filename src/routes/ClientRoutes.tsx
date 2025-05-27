
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdvertiserLayout from '@/components/advertiser/AdvertiserLayout';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';
import MyCampaigns from '@/pages/advertiser/MyCampaigns';
import CampaignDetails from '@/pages/advertiser/CampaignDetails';
import MyVideos from '@/pages/advertiser/MyVideos';
import AdvertiserReports from '@/pages/advertiser/AdvertiserReports';
import AdvertiserSettings from '@/pages/advertiser/AdvertiserSettings';
import PanelStore from '@/pages/PanelStore';
import Checkout from '@/pages/Checkout';
import Pedidos from '@/pages/Pedidos';

export const ClientRoutes = () => {
  return (
    <Routes>
      {/* Rotas com layout do anunciante */}
      <Route path="/" element={<AdvertiserLayout />}>
        <Route index element={<AdvertiserDashboard />} />
        <Route path="campanhas" element={<MyCampaigns />} />
        <Route path="campanhas/:id" element={<CampaignDetails />} />
        <Route path="videos" element={<MyVideos />} />
        <Route path="relatorios" element={<AdvertiserReports />} />
        <Route path="configuracoes" element={<AdvertiserSettings />} />
      </Route>
      
      {/* Rotas sem layout específico */}
      <Route path="/comprar" element={<PanelStore />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pedidos" element={<Pedidos />} />
      <Route path="/meus-pedidos" element={<Pedidos />} />
    </Routes>
  );
};

export default ClientRoutes;
