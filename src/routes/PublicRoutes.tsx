
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlanSelection from '@/pages/PlanSelection';
import CheckoutCoupon from '@/pages/CheckoutCoupon';
import CheckoutSummary from '@/pages/CheckoutSummary';
import CheckoutFinish from '@/pages/CheckoutFinish';
import Payment from '@/pages/Payment';
import Confirmacao from '@/pages/Confirmacao';

const InteresseSindicoLanding = React.lazy(() => import('@/pages/InteresseSindicoLanding'));

export const PublicRoutes = () => {
  return (
    <Routes>
      {/* Plan selection */}
      <Route path="/planos" element={<PlanSelection />} />
      <Route path="/selecionar-plano" element={<PlanSelection />} />
      
      {/* MEGA CHECKOUT FLOW - Rotas corrigidas */}
      <Route path="/checkout/cupom" element={<CheckoutCoupon />} />
      <Route path="/checkout/resumo" element={<CheckoutSummary />} />
      <Route path="/checkout/finalizar" element={<CheckoutFinish />} />
      
      {/* Payment processing pages */}
      <Route path="/payment" element={<Payment />} />
      
      {/* CONFIRMAÇÕES SEPARADAS */}
      <Route path="/confirmacao" element={<Confirmacao />} /> {/* EMAIL CONFIRMATION */}
      <Route path="/pedido-confirmado" element={<Confirmacao />} /> {/* ORDER CONFIRMATION - usando a mesma página por enquanto */}

      {/* Landing pública - Interesse do Síndico */}
      <Route path="/interessesindico" element={<InteresseSindicoLanding />} />
    </Routes>
  );
};

export default PublicRoutes;
