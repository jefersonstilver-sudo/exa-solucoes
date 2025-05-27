
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PanelStore from '@/pages/PanelStore';
import Checkout from '@/pages/Checkout';
import Pedidos from '@/pages/Pedidos';
import AdvertiserDashboard from '@/pages/advertiser/AdvertiserDashboard';
import MyCampaigns from '@/pages/advertiser/MyCampaigns';
import CampaignDetails from '@/pages/advertiser/CampaignDetails';
import MyVideos from '@/pages/advertiser/MyVideos';

export const ClientRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdvertiserDashboard />} />
      <Route path="/dashboard" element={<AdvertiserDashboard />} />
      <Route path="/comprar" element={<PanelStore />} />
      <Route path="/checkout" element={<Checkout />} />
      {/* CORREÇÃO: Rota direta para pedidos sem redirecionamento */}
      <Route path="/pedidos" element={<Pedidos />} />
      <Route path="/meus-pedidos" element={<Pedidos />} />
      <Route path="/campanhas" element={<MyCampaigns />} />
      <Route path="/campanhas/:id" element={<CampaignDetails />} />
      <Route path="/videos" element={<MyVideos />} />
    </Routes>
  );
};

export default ClientRoutes;
