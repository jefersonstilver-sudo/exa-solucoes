
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw } from 'lucide-react';

interface AdminFixerActionsProps {
  onFixMasterAdmin: () => void;
  onLoginDirectly: () => void;
  isLoading: boolean;
  result: any;
}

const AdminFixerActions = ({ 
  onFixMasterAdmin, 
  onLoginDirectly, 
  isLoading, 
  result 
}: AdminFixerActionsProps) => {
  return (
    <div className="space-y-2">
      <Button 
        onClick={onFixMasterAdmin}
        disabled={isLoading}
        className="w-full"
        variant={result ? "outline" : "default"}
      >
        {isLoading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            {result ? 'Verificar Novamente' : 'Corrigir Usuario Master'}
          </>
        )}
      </Button>
      
      <Button 
        onClick={onLoginDirectly}
        disabled={isLoading}
        className="w-full"
        variant="secondary"
      >
        {isLoading ? (
          <>Processando...</>
        ) : (
          <>Login Direto (Senha Original)</>
        )}
      </Button>
    </div>
  );
};

export default AdminFixerActions;
