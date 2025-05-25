
import React from 'react';
import Layout from '@/components/layout/Layout';
import AuthHookDiagnosticCenter from '@/components/debug/AuthHookDiagnosticCenter';

const AuthHookDiagnosticPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔧 INDEXA Auth Hook Diagnostic Center
            </h1>
            <p className="text-gray-600">
              Sistema completo de diagnóstico e correção do Auth Hook para resolução definitiva dos problemas de autenticação
            </p>
          </div>
          
          <AuthHookDiagnosticCenter />
        </div>
      </div>
    </Layout>
  );
};

export default AuthHookDiagnosticPage;
