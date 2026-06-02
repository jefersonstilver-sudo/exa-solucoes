import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, Settings2, Loader2, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type TestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string };

const CRMEvolutionPage: React.FC = () => {
  const [test, setTest] = useState<TestState>({ status: 'idle' });

  const callEvolution = async (
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown,
  ) => {
    const { data, error } = await supabase.functions.invoke('evolution-proxy', {
      body: { path, method, body },
    });
    if (error) throw new Error(error.message);
    return data as { status: number; data: unknown };
  };

  const handleTest = async () => {
    setTest({ status: 'loading' });
    try {
      const res = await callEvolution('/instance/fetchInstances', 'GET');
      if (res.status >= 200 && res.status < 300) {
        setTest({ status: 'success', data: res.data });
      } else {
        setTest({
          status: 'error',
          message: `Evolution respondeu HTTP ${res.status}: ${JSON.stringify(res.data)}`,
        });
      }
    } catch (e: any) {
      setTest({ status: 'error', message: e?.message ?? 'Erro desconhecido' });
    }
  };

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

        <div className="p-6 md:p-10">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                <Settings2 className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Conexão segura configurada
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-md">
                A URL e a API key da Evolution estão armazenadas como secrets no
                servidor. Todas as chamadas passam pela edge function{' '}
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  evolution-proxy
                </span>{' '}
                com validação de JWT e role.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={handleTest}
                disabled={test.status === 'loading'}
                className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                {test.status === 'loading' && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Testar conexão com Evolution API
              </Button>

              {test.status === 'success' && (
                <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Conexão estabelecida
                  </div>
                  <pre className="text-xs text-emerald-900/80 overflow-auto max-h-64">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </div>
              )}

              {test.status === 'error' && (
                <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    Falha ao conectar
                  </div>
                  <p className="text-xs text-red-900/80 break-all">
                    {test.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CRMEvolutionPage;
