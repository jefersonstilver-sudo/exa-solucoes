import React, { Suspense, lazy } from 'react';
import GlobalLoadingPage from '@/components/loading/GlobalLoadingPage';
import { useDynamicModulePermissions } from '@/hooks/useDynamicModulePermissions';
import { Shield } from 'lucide-react';

// Reutiliza o CRMUnificado existente (Chat WhatsApp)
const CRMUnificado = lazy(() => import('@/modules/monitoramento-ia/pages/CRMUnificado'));

const ChatTab: React.FC = () => {
  const { hasCRMAccess, isCEO, isComercial, isLoading } = useDynamicModulePermissions();

  // Aguardar carregamento das permissões
  if (isLoading) {
    return <GlobalLoadingPage message="Verificando permissões..." />;
  }

  // Se não tem acesso ao CRM, mostrar mensagem de acesso negado
  if (!hasCRMAccess) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden -mx-4 md:mx-0">
        <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acesso Restrito
          </h2>
          <p className="text-muted-foreground max-w-md">
            O CRM está disponível apenas para o CEO e equipe Comercial.
            {isComercial && ' Como comercial, você pode ver apenas suas próprias conversas.'}
          </p>
        </div>
      </div>
    );
  }

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
