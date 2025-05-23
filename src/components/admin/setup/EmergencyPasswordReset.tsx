
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react';

const EmergencyPasswordReset = () => {
  const [email, setEmail] = useState('jefersonstilver@gmail.com');
  const [newPassword, setNewPassword] = useState('admin123456');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Iniciando reset de senha de emergência...');
      
      const response = await fetch('https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/emergency-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
        },
        body: JSON.stringify({
          email,
          newPassword,
          confirmationCode
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao resetar senha');
      }
      
      setResult(data);
      toast.success('Senha resetada com sucesso!');
      
      // Limpar campos sensíveis
      setConfirmationCode('');
      
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
          Reset de Senha de Emergência
        </CardTitle>
        <CardDescription>
          Use esta ferramenta apenas em casos de emergência para resetar a senha do admin master.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {result ? (
          <Alert className="border-green-200 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <p className="font-medium">Senha resetada com sucesso!</p>
              <p className="text-sm mt-1">Email: {result.user?.email}</p>
              <p className="text-sm">Nova senha: {newPassword}</p>
              <p className="text-xs text-gray-600 mt-2">
                Agora você pode fazer login com a nova senha.
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
        
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Admin</Label>
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
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Digite a nova senha"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmationCode">Código de Confirmação</Label>
            <Input
              id="confirmationCode"
              type="text"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              required
              disabled={isLoading}
              placeholder="EMERGENCY_RESET_2024"
            />
            <p className="text-xs text-gray-500">
              Digite: EMERGENCY_RESET_2024
            </p>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading || !confirmationCode}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Key className="mr-2 h-4 w-4 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Resetar Senha
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <p><strong>⚠️ Atenção:</strong> Esta é uma ferramenta de emergência.</p>
          <p>Use apenas quando não conseguir acessar o sistema normalmente.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyPasswordReset;
