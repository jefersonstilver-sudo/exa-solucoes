
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  email?: string;
  user_role?: string;
  role?: string;
  [key: string]: any;
}

export const AuthHookValidator = () => {
  const [isTestingLogin, setIsTestingLogin] = useState(false);
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null);
  const [rawJWT, setRawJWT] = useState<string>('');
  const [testResults, setTestResults] = useState<{
    authHookExecuted: boolean;
    userRolePresent: boolean;
    correctRole: boolean;
    sessionValid: boolean;
    errorMessage?: string;
  } | null>(null);

  const decodeJWT = (token: string): JWTPayload | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Erro ao decodificar JWT:', error);
      return null;
    }
  };

  const testAuthHook = async () => {
    setIsTestingLogin(true);
    setTestResults(null);
    setJwtPayload(null);
    setRawJWT('');

    try {
      console.log('🧪 INDEXA AUTH HOOK TEST - Iniciando teste completo...');
      
      // Fazer logout primeiro para garantir teste limpo
      await supabase.auth.signOut();
      
      toast.info('Fazendo login de teste com jefersonstilver@gmail.com...', {
        duration: 3000
      });

      // Fazer login com as credenciais do super admin
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'jefersonstilver@gmail.com',
        password: '573039'
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setTestResults({
          authHookExecuted: false,
          userRolePresent: false,
          correctRole: false,
          sessionValid: false,
          errorMessage: `Erro de login: ${error.message}`
        });
        toast.error(`Erro no login: ${error.message}`);
        return;
      }

      if (!data.session?.access_token) {
        setTestResults({
          authHookExecuted: false,
          userRolePresent: false,
          correctRole: false,
          sessionValid: false,
          errorMessage: 'Nenhum access_token retornado'
        });
        toast.error('Sessão inválida - sem access_token');
        return;
      }

      console.log('✅ Login realizado com sucesso');
      setRawJWT(data.session.access_token);

      // Decodificar JWT para verificar claims
      const payload = decodeJWT(data.session.access_token);
      setJwtPayload(payload);

      if (!payload) {
        setTestResults({
          authHookExecuted: false,
          userRolePresent: false,
          correctRole: false,
          sessionValid: true,
          errorMessage: 'Falha ao decodificar JWT'
        });
        toast.error('Falha ao decodificar JWT');
        return;
      }

      console.log('🔍 JWT Payload completo:', payload);

      // Verificar se user_role está presente
      const hasUserRole = !!payload.user_role;
      const isCorrectRole = payload.user_role === 'super_admin';
      const authHookExecuted = hasUserRole; // Se user_role está presente, o hook executou

      setTestResults({
        authHookExecuted,
        userRolePresent: hasUserRole,
        correctRole: isCorrectRole,
        sessionValid: true,
        errorMessage: !authHookExecuted ? 'Auth Hook não executou - user_role ausente' : undefined
      });

      // Mostrar resultados
      if (authHookExecuted && isCorrectRole) {
        toast.success('🎉 Auth Hook funcionando perfeitamente!', {
          duration: 5000
        });
        console.log('🎯 SUCESSO COMPLETO: Auth Hook injetou user_role corretamente');
      } else if (authHookExecuted && !isCorrectRole) {
        toast.warning(`Auth Hook executou mas role incorreta: ${payload.user_role}`, {
          duration: 5000
        });
      } else {
        toast.error('❌ Auth Hook NÃO executou - user_role ausente no JWT', {
          duration: 5000
        });
      }

    } catch (error: any) {
      console.error('💥 Erro inesperado no teste:', error);
      setTestResults({
        authHookExecuted: false,
        userRolePresent: false,
        correctRole: false,
        sessionValid: false,
        errorMessage: `Erro inesperado: ${error.message}`
      });
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsTestingLogin(false);
    }
  };

  const getCurrentSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        setRawJWT(data.session.access_token);
        const payload = decodeJWT(data.session.access_token);
        setJwtPayload(payload);
        
        toast.info('JWT da sessão atual carregado', {
          duration: 2000
        });
      } else {
        toast.warning('Nenhuma sessão ativa encontrada');
      }
    } catch (error) {
      toast.error('Erro ao obter sessão atual');
    }
  };

  const getStatusIcon = (status: boolean, neutral = false) => {
    if (neutral) return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    return status ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-6 w-6" />
            INDEXA Auth Hook Validator
          </CardTitle>
          <CardDescription className="text-amber-700">
            Ferramenta de debug para validar se o Auth Hook está injetando user_role no JWT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={testAuthHook} 
              disabled={isTestingLogin}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isTestingLogin ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Testar Auth Hook
                </>
              )}
            </Button>
            
            <Button onClick={getCurrentSession} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Sessão Atual
            </Button>
          </div>

          {testResults && (
            <Card className="bg-slate-50">
              <CardHeader>
                <CardTitle className="text-lg">Resultados do Teste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {getStatusBadge(testResults.sessionValid, 'Sessão Válida')}
                  {getStatusBadge(testResults.authHookExecuted, 'Auth Hook Executado')}
                  {getStatusBadge(testResults.userRolePresent, 'user_role Presente')}
                  {getStatusBadge(testResults.correctRole, 'Role Correto (super_admin)')}
                </div>
                
                {testResults.errorMessage && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-800 font-medium">❌ Erro:</p>
                    <p className="text-red-700">{testResults.errorMessage}</p>
                  </div>
                )}
                
                {testResults.authHookExecuted && testResults.correctRole && (
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-800 font-bold">🎉 SUCESSO COMPLETO!</p>
                    <p className="text-green-700">Auth Hook está funcionando e injetando user_role corretamente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {jwtPayload && (
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">JWT Payload Decodificado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Email:</strong> {jwtPayload.email || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>user_role:</strong> 
                      {jwtPayload.user_role ? (
                        <Badge variant="default">{jwtPayload.user_role}</Badge>
                      ) : (
                        <Badge variant="destructive">AUSENTE</Badge>
                      )}
                    </div>
                    <div>
                      <strong>Issued At:</strong> {jwtPayload.iat ? new Date(jwtPayload.iat * 1000).toLocaleString() : 'N/A'}
                    </div>
                    <div>
                      <strong>Expires:</strong> {jwtPayload.exp ? new Date(jwtPayload.exp * 1000).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-900">
                      Ver payload completo (clique para expandir)
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-xs overflow-auto max-h-40">
                      {JSON.stringify(jwtPayload, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}

          {rawJWT && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Raw JWT Token</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea 
                  value={rawJWT} 
                  readOnly 
                  className="w-full h-20 p-2 text-xs font-mono bg-white border rounded resize-none"
                  placeholder="JWT aparecerá aqui após login/verificação"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token JWT completo para análise manual (pode ser decodificado em jwt.io)
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthHookValidator;
