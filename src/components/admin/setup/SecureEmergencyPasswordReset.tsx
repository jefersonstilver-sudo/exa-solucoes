
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { checkRateLimit } from '@/utils/securityUtils';

const SecureEmergencyPasswordReset = () => {
  const [email, setEmail] = useState('jefersonstilver@gmail.com');
  const [secureToken, setSecureToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side rate limiting
    if (!checkRateLimit('emergency-reset', 3, 900000)) {
      setError('Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Iniciando reset de emergência seguro...');
      
      const response = await fetch('/api/supabase/functions/v1/secure-emergency-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          secureToken
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }
      
      setResult(data);
      toast.success('Senha resetada com sucesso!');
      
      // Clear sensitive data
      setSecureToken('');
      
    } catch (err: any) {
      console.error('Erro ao resetar senha:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Shield className="h-5 w-5" />
          Reset de Emergência Seguro
        </CardTitle>
        <CardDescription>
          Sistema seguro de reset de senha para situações de emergência.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {result ? (
          <Alert className="border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <p className="font-medium">Reset realizado com sucesso!</p>
              <p className="text-sm mt-1">Email: {result.user?.email}</p>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm font-medium text-yellow-800">Senha temporária:</p>
                <p className="text-sm font-mono text-yellow-900 break-all">{result.temporary_password}</p>
                <p className="text-xs text-yellow-700 mt-1">⚠️ ALTERE IMEDIATAMENTE APÓS O LOGIN</p>
              </div>
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
        
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Administrador</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secureToken">Token de Segurança</Label>
            <Input
              id="secureToken"
              type="password"
              value={secureToken}
              onChange={(e) => setSecureToken(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Token obtido via canal seguro"
            />
            <p className="text-xs text-gray-500">
              Token deve ser obtido através de canal seguro previamente estabelecido
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !secureToken}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Key className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Executar Reset Seguro
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>🔒 Segurança:</strong></p>
          <ul className="mt-1 space-y-1 list-disc list-inside">
            <li>Token criptograficamente seguro obrigatório</li>
            <li>Rate limiting aplicado (3 tentativas por 15 min)</li>
            <li>Senha gerada automaticamente (16 caracteres)</li>
            <li>Logs de segurança registrados</li>
            <li>Senha deve ser alterada no primeiro login</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureEmergencyPasswordReset;
