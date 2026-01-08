import React, { Suspense, lazy } from 'react';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';

// Reutiliza o CRMUnificado existente (Chat WhatsApp)
const CRMUnificado = lazy(() => import('@/modules/monitoramento-ia/pages/CRMUnificado'));

const ChatTab: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden -mx-4 md:mx-0">
      <Suspense fallback={<GlobalLoadingPage message="Carregando Chat..." />}>
        <div className="h-[calc(100vh-280px)] min-h-[500px]">
          <CRMUnificado />
        </div>
      </Suspense>
    </div>
  );
};

export default ChatTab;
