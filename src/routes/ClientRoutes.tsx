
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PanelStore from '@/pages/PanelStore';

export const ClientRoutes = () => {
  return (
    <Routes>
      {/* Rotas específicas de cliente que não estão no portal do anunciante */}
      <Route path="/comprar" element={<PanelStore />} />
    </Routes>
  );
};

export default ClientRoutes;
