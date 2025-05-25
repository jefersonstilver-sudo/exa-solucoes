
import React from 'react';
import Layout from '@/components/layout/Layout';
import AuthDiagnostic from '@/components/debug/AuthDiagnostic';

const AuthDiagnosticPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🔍 INDEXA Auth Diagnostic
            </h1>
            <p className="text-gray-600">
              Diagnóstico completo do sistema de autenticação para identificar problemas com Auth Hook
            </p>
          </div>
          
          <AuthDiagnostic />
        </div>
      </div>
    </Layout>
  );
};

export default AuthDiagnosticPage;
