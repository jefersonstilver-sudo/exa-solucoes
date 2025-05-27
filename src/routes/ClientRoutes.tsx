
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PanelStore from '@/pages/PanelStore';
import Checkout from '@/pages/Checkout';

export const ClientRoutes = () => {
  return (
    <Routes>
      {/* Rotas específicas de cliente que não estão no portal do anunciante */}
      <Route path="/comprar" element={<PanelStore />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  );
};

export default ClientRoutes;
