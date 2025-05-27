
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PanelStore from '@/pages/PanelStore';
import Checkout from '@/pages/Checkout';
import Pedidos from '@/pages/Pedidos';

export const ClientRoutes = () => {
  return (
    <Routes>
      {/* Rotas sem layout específico - apenas rotas que não são do anunciante */}
      <Route path="/comprar" element={<PanelStore />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/pedidos" element={<Pedidos />} />
      <Route path="/meus-pedidos" element={<Pedidos />} />
    </Routes>
  );
};

export default ClientRoutes;
