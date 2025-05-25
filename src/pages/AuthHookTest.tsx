
import React from 'react';
import Layout from '@/components/layout/Layout';
import AuthHookValidator from '@/components/debug/AuthHookValidator';

const AuthHookTest = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              INDEXA Auth Hook Test
            </h1>
            <p className="text-gray-600">
              Ferramenta de debug para validar a configuração do Auth Hook e verificar se user_role está sendo injetado no JWT
            </p>
          </div>
          
          <AuthHookValidator />
        </div>
      </div>
    </Layout>
  );
};

export default AuthHookTest;
