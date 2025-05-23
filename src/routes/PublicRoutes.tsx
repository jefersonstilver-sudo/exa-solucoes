
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import Confirmacao from '@/pages/Confirmacao';

export const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/planos" element={<PlanSelection />} />
      <Route path="/confirmacao" element={<Confirmacao />} />
    </Routes>
  );
};

export default PublicRoutes;
