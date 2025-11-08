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

  // Detectar se é erro de domínio não verificado
  const isDomainError = errorMessage?.includes('not verified') || 
                        errorMessage?.includes('domain') || 
                        errorMessage?.includes('examidia.com.br') ||
                        errorMessage?.includes('DOMÍNIO NÃO VERIFICADO');

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isDomainError ? '⚠️ Domínio não verificado no Resend' : '⚠️ Email não configurado'}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        {isDomainError ? (
          <>
            <p className="text-sm font-semibold">
              O domínio <code className="bg-muted px-1 rounded">examidia.com.br</code> não está verificado no Resend.
            </p>
            <p className="text-sm">
              <strong>Emails de boas-vindas NÃO serão enviados</strong> até a verificação ser concluída.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold">🔧 Para resolver (executar AGORA):</p>
              <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                <li>Acesse <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary font-semibold">resend.com/domains</a></li>
                <li>Adicione o domínio <code className="bg-muted px-1 rounded">examidia.com.br</code></li>
                <li>Configure os registros DNS (SPF, DKIM, DMARC) conforme instruído</li>
                <li>Aguarde verificação (pode levar até 48 horas)</li>
              </ol>
              <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded border border-yellow-300 dark:border-yellow-700">
                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                  ℹ️ Enquanto o domínio não for verificado, emails só podem ser enviados para: <code className="bg-muted px-1 rounded">jefersonstilver@gmail.com</code>
                </p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => window.open('https://resend.com/domains', '_blank')}
                  className="bg-primary hover:bg-primary/90"
                >
                  🔧 Verificar Domínio Agora
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('https://docs.examidia.com.br/RESEND_DOMAIN_SETUP.md', '_blank')}
                >
                  📖 Ver Documentação
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
        {errorMessage && (
          <div className="mt-3 p-2 bg-destructive/10 rounded text-xs font-mono max-h-32 overflow-y-auto">
            <strong>Erro técnico:</strong> {errorMessage}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default EmailConfigWarning;
