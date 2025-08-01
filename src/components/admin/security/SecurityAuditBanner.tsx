import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface SecurityAuditBannerProps {
  showBanner?: boolean;
}

const SecurityAuditBanner: React.FC<SecurityAuditBannerProps> = ({ showBanner = true }) => {
  if (!showBanner) return null;

  return (
    <Alert className="border-green-200 bg-green-50 mb-4">
      <Shield className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">✅ Correções de Segurança Aplicadas</p>
            <p className="text-sm mt-1">
              • Funções privilegiadas agora usam autenticação segura
              • Senhas hardcoded foram removidas 
              • Validação de entrada implementada
              • Logs de segurança habilitados
            </p>
          </div>
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SecurityAuditBanner;