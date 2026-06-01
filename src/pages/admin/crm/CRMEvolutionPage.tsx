import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Settings2 } from 'lucide-react';

const CRMEvolutionPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>CRM Evolution | EXA Admin</title>
        <meta
          name="description"
          content="CRM para acompanhar conversas dos colaboradores via Evolution API"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center shadow-sm">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                CRM Evolution
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Conversas dos colaboradores via Evolution API
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="p-6 md:p-10">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Settings2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aguardando configuração
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Esta página está pronta para receber a integração com a{' '}
              <span className="font-medium text-gray-700">Evolution API</span>.
              Configure o servidor e a chave de API para começar a visualizar as
              conversas dos seus colaboradores em tempo real.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CRMEvolutionPage;
