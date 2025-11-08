import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailConfigWarningProps {
  show: boolean;
  errorMessage?: string;
}

const EmailConfigWarning: React.FC<EmailConfigWarningProps> = ({ show, errorMessage }) => {
  if (!show) return null;

  return (
    <Alert variant="destructive" className="border-2 border-red-300 bg-red-50">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">⚠️ Configuração de Email Necessária</AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <p className="text-sm">
          <strong>O sistema de emails não está configurado.</strong> Os usuários não receberão:
        </p>
        <ul className="text-sm space-y-1 ml-4 list-disc">
          <li>Email de boas-vindas com credenciais</li>
          <li>Links de confirmação de conta</li>
          <li>Emails de recuperação de senha</li>
        </ul>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-300 rounded p-2 text-xs font-mono">
            {errorMessage}
          </div>
        )}
        
        <div className="pt-2 space-y-2">
          <p className="text-sm font-semibold">Para configurar o Resend:</p>
          <ol className="text-sm space-y-1 ml-4 list-decimal">
            <li>Acesse <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">resend.com</a> e crie uma conta</li>
            <li>Valide seu domínio em <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">resend.com/domains</a></li>
            <li>Crie uma API key em <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">resend.com/api-keys</a></li>
            <li>Configure a variável de ambiente <code className="bg-red-200 px-1 rounded">RESEND_API_KEY</code></li>
          </ol>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => window.open('https://resend.com/api-keys', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Criar API Key
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => window.open('https://resend.com/domains', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Validar Domínio
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmailConfigWarning;
