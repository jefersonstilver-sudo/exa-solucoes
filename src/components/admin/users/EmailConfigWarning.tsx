import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailConfigWarningProps {
  show: boolean;
  errorMessage?: string;
}

const EmailConfigWarning: React.FC<EmailConfigWarningProps> = ({ show, errorMessage }) => {
  if (!show) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>⚠️ Email não configurado</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          O sistema de envio de emails não está configurado. 
          <strong> Os emails de boas-vindas NÃO serão enviados automaticamente.</strong>
        </p>
        <p className="text-sm">
          Você precisará informar as credenciais manualmente para os novos administradores.
        </p>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold">Para configurar o serviço de email Resend:</p>
          <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
            <li>Crie uma conta em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">resend.com</a></li>
            <li>Obtenha sua API key em <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">resend.com/api-keys</a></li>
            <li>Configure a variável de ambiente <code className="bg-muted px-1 rounded">RESEND_API_KEY</code></li>
          </ol>
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://resend.com', '_blank')}
            >
              Ir para Resend
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://resend.com/api-keys', '_blank')}
            >
              Obter API Key
            </Button>
          </div>
        </div>
        {errorMessage && (
          <div className="mt-3 p-2 bg-destructive/10 rounded text-xs font-mono">
            <strong>Erro:</strong> {errorMessage}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default EmailConfigWarning;
