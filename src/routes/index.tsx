import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthRoutes from './AuthRoutes';
import TwoFactorVerificationPage from '@/pages/auth/TwoFactorVerificationPage';

const Home = React.lazy(() => import('@/pages/Home'));
const InteresseSindicoLanding = React.lazy(() => import('@/pages/InteresseSindicoLanding'));

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/verificacao-2fa" element={<TwoFactorVerificationPage />} />
      <Route path="/interessesindico" element={<InteresseSindicoLanding />} />
      <Route path="/*" element={<AuthRoutes />} />
    </Routes>
  );
};

export default AppRoutes;
