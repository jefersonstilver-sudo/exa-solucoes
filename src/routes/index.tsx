import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthRoutes from './AuthRoutes';
import TwoFactorVerificationPage from '@/pages/auth/TwoFactorVerificationPage';

const Home = React.lazy(() => import('@/pages/Home'));
const InteresseSindicoLanding = React.lazy(() => import('@/pages/InteresseSindicoLanding'));
const InteresseSindicoFormulario = React.lazy(() => import('@/pages/InteresseSindicoFormulario'));
const InteresseSindicoSucesso = React.lazy(() => import('@/pages/InteresseSindicoSucesso'));

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/verificacao-2fa" element={<TwoFactorVerificationPage />} />
      <Route path="/interessesindico" element={<InteresseSindicoLanding />} />
      <Route path="/interessesindico/formulario" element={<InteresseSindicoFormulario />} />
      <Route path="/interessesindico/sucesso" element={<InteresseSindicoSucesso />} />
      <Route path="/*" element={<AuthRoutes />} />
    </Routes>
  );
};

export default AppRoutes;
