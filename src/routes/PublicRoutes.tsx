
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import Checkout from '@/pages/Checkout';
import CheckoutFinish from '@/pages/CheckoutFinish';
import Confirmacao from '@/pages/Confirmacao';
import BuildingStorePage from '@/pages/BuildingStore';

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/planos" element={<PlanSelection />} />
      <Route path="/selecionar-plano" element={<PlanSelection />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
      <Route path="/confirmacao" element={<Confirmacao />} />
      <Route path="/predios-loja" element={<BuildingStorePage />} />
      <Route path="/building-store" element={<BuildingStorePage />} />
    </Routes>
  );
};

export default PublicRoutes;
