
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import Confirmacao from '@/pages/Confirmacao';
import BuildingStorePage from '@/pages/BuildingStore';
import PlansPage from '@/pages/PlansPage';

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/planos" element={<PlansPage />} />
      <Route path="/selecionar-plano" element={<PlanSelection />} />
      <Route path="/confirmacao" element={<Confirmacao />} />
      <Route path="/predios-loja" element={<BuildingStorePage />} />
    </Routes>
  );
};

export default PublicRoutes;
