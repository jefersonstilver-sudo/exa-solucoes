
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Sync, CheckCircle, AlertTriangle } from 'lucide-react';

const UserMetadataSync = () => {
  const [email, setEmail] = useState('jefersonstilver@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Iniciando sincronização de metadados...');
      
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        },
        body: JSON.stringify({
          email
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao sincronizar metadados');
      }
      
      setResult(data);
      toast.success('Metadados sincronizados com sucesso!');
      
    } catch (err: any) {
      console.error('Erro ao sincronizar metadados:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Sync className="h-5 w-5" />
          Sincronização de Metadados
        </CardTitle>
        <CardDescription>
          Sincroniza o role da tabela users com os metadados do auth.users para corrigir problemas de login.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {result ? (
          <Alert className="border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <p className="font-medium">Metadados sincronizados com sucesso!</p>
              <p className="text-sm mt-1">Email: {result.user?.email}</p>
              <p className="text-sm">Role: {result.user?.role}</p>
              <p className="text-xs text-gray-600 mt-2">
                Agora você pode fazer login normalmente.
              </p>
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Alert className="border-red-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <p className="font-medium">Erro:</p>
              <p className="text-sm">{error}</p>
            </AlertDescription>
          </Alert>
        ) : null}
        
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Sync className="mr-2 h-4 w-4 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Sync className="mr-2 h-4 w-4" />
                Sincronizar Metadados
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>ℹ️ Info:</strong> Esta ferramenta sincroniza o role da tabela users com os metadados do auth.users.</p>
          <p>Isso corrige problemas onde o LoginForm não consegue determinar o role do usuário.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserMetadataSync;
