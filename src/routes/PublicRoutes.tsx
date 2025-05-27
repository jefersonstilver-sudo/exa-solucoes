
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import Checkout from '@/pages/Checkout';
import CheckoutCoupon from '@/pages/CheckoutCoupon';
import CheckoutSummary from '@/pages/CheckoutSummary';
import CheckoutFinish from '@/pages/CheckoutFinish';
import PixPayment from '@/pages/PixPayment';
import Payment from '@/pages/Payment';
import Confirmacao from '@/pages/Confirmacao';

export const PublicRoutes = () => {
  return (
    <Routes>
      {/* Plan selection */}
      <Route path="/planos" element={<PlanSelection />} />
      <Route path="/selecionar-plano" element={<PlanSelection />} />
      
      {/* MEGA CHECKOUT FLOW - Rotas corrigidas */}
      <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
      <Route path="/checkout/resumo" element={<CheckoutSummary />} />
      <Route path="/checkout" element={<Checkout />} /> {/* SELEÇÃO DE MÉTODO DE PAGAMENTO */}
      <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
      
      {/* Payment processing pages */}
      <Route path="/pix-payment" element={<PixPayment />} />
      <Route path="/payment" element={<Payment />} />
      
      {/* Confirmation */}
      <Route path="/confirmacao" element={<Confirmacao />} />
      <Route path="/pedido-confirmado" element={<Confirmacao />} />
    </Routes>
  );
};

export default PublicRoutes;
