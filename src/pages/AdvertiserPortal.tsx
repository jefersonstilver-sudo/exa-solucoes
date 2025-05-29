
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdvertiserLayout from '@/components/advertiser/AdvertiserLayout';
import { VideoManagementPage } from './VideoManagementPage';

export const AdvertiserPortal = () => {
  return (
    <Routes>
      <Route path="/*" element={<AdvertiserLayout />}>
        <Route path="pedido/:pedidoId" element={<VideoManagementPage />} />
        <Route path="" element={<div>Dashboard do Anunciante</div>} />
      </Route>
    </Routes>
  );
};

export default AdvertiserPortal;
