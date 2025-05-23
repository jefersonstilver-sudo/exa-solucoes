
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const MasterAdminFixer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fixMasterAdmin = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/fix-master-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao corrigir admin master');
      }
      
      setResult(data);
      toast.success(`Usuário admin master ${data.action === 'created' ? 'criado' : 'atualizado'} com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao corrigir admin master:', err);
      setError(err.message);
      toast.error(`Erro ao corrigir admin master: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-red-500" />
          Corrigir Usuário Master
        </CardTitle>
        <CardDescription>
          Corrija problemas de autenticação do usuário administrador master.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {result ? (
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">{result.message}</p>
              <p className="text-sm text-gray-600">
                Email: {result.user?.email}
              </p>
              {result.confirmed !== undefined && (
                <p className="text-sm text-gray-600">
                  Email confirmado: {result.confirmed ? 'Sim' : 'Não'}
                </p>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-red-500">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Erro:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Clique para verificar e corrigir o usuário master.
            </p>
            <p className="text-xs text-gray-500">
              Email: jefersonstilver@gmail.com<br />
              Senha: 573039
            </p>
          </div>
        )}
        
        <Button 
          onClick={fixMasterAdmin}
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
      </CardContent>
    </Card>
  );
};

export default MasterAdminFixer;
