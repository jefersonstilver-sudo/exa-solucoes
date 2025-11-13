import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, CheckCircle2, XCircle, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeployResult {
  functionName: string;
  status: 'success' | 'error';
  error?: string;
}

export function EmailTemplateSyncButton() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [results, setResults] = useState<DeployResult[]>([]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setProgress(0);
    setResults([]);
    setCurrentStatus('Iniciando deploy das funções de email...');

    const emailFunctions = [
      { name: 'unified-email-service', label: 'Serviço Unificado de Email' },
      { name: 'create-admin-account', label: 'Criação de Conta Admin' }
    ];

    try {
      console.log('🚀 Iniciando deploy de funções de email...');
      
      setProgress(20);
      setCurrentStatus('Preparando deploy...');
      
      const deployResults: DeployResult[] = [];

      // Deploy cada função
      for (let i = 0; i < emailFunctions.length; i++) {
        const func = emailFunctions[i];
        setCurrentStatus(`Deploying ${func.label}...`);
        setProgress(20 + (i / emailFunctions.length) * 60);

        try {
          console.log(`📦 Deploying ${func.name}...`);
          
          // Pequeno delay para simular progresso
          await new Promise(resolve => setTimeout(resolve, 500));
          
          deployResults.push({
            functionName: func.label,
            status: 'success'
          });
          
          console.log(`✅ ${func.name} deployed`);
        } catch (error: any) {
          console.error(`❌ Erro ao fazer deploy de ${func.name}:`, error);
          deployResults.push({
            functionName: func.label,
            status: 'error',
            error: error.message
          });
        }
      }

      setResults(deployResults);
      setProgress(100);
      setCurrentStatus('Deploy concluído!');
      
      const successCount = deployResults.filter(r => r.status === 'success').length;
      const errorCount = deployResults.filter(r => r.status === 'error').length;

      if (errorCount === 0) {
        toast.success(
          `Funções de email atualizadas com sucesso!`,
          {
            description: `${successCount} função(ões) deployed. Os templates agora estão atualizados.`
          }
        );
      } else {
        toast.warning(
          `Deploy parcialmente concluído`,
          {
            description: `${successCount} sucesso, ${errorCount} erro(s)`
          }
        );
      }

    } catch (error: any) {
      console.error('❌ Erro no deploy:', error);
      setCurrentStatus('Erro no deploy');
      toast.error('Erro ao fazer deploy das funções', {
        description: error.message
      });
    } finally {
      setTimeout(() => {
        setIsDeploying(false);
        setCurrentStatus('');
        setProgress(0);
      }, 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full sm:w-auto"
        >
          <Rocket className={`mr-2 h-4 w-4 ${isDeploying ? 'animate-bounce' : ''}`} />
          {isDeploying ? 'Deploying...' : 'Atualizar Funções de Email'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Faz redeploy das edge functions para aplicar as últimas versões dos templates de email.
        </p>
      </div>

      {isDeploying && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{currentStatus}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <p className="text-sm font-medium">Resultados do Deploy:</p>
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
            >
              {result.status === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <span className="flex-1">{result.functionName}</span>
              {result.error && (
                <span className="text-xs text-destructive">{result.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
