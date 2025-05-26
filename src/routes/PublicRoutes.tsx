
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import Confirmacao from '@/pages/Confirmacao';
import BuildingStorePage from '@/pages/BuildingStore';

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/planos" element={<PlanSelection />} />
      <Route path="/selecionar-plano" element={<PlanSelection />} />
      <Route path="/confirmacao" element={<Confirmacao />} />
      <Route path="/predios-loja" element={<BuildingStorePage />} />
      <Route path="/building-store" element={<BuildingStorePage />} />
    </Routes>
  );
};

export default PublicRoutes;
