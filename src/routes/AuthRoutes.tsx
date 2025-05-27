
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Cadastro from '@/pages/Cadastro';

export const AuthRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      {/* Fallback route - redirect /auth to /login */}
      <Route path="/*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;
