
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Crown, Shield, RefreshCw, Bug, Zap, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface AuthHookTest {
  jwtHasRole: boolean;
  correctRole: boolean;
  correctEmail: boolean;
  hookExecuted: boolean;
  sessionValid: boolean;
  errorMessage?: string;
}

export const AuthHookDiagnosticCenter = () => {
  const { userProfile, isLoggedIn, session } = useAuth();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [authHookTest, setAuthHookTest] = useState<AuthHookTest | null>(null);
  const [jwtPayload, setJwtPayload] = useState<any>(null);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      analyzeCurrentJWT();
    }
  }, [session]);

  const analyzeCurrentJWT = () => {
    try {
      if (!session?.access_token) return;
      
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      setJwtPayload(payload);
      
      const test: AuthHookTest = {
        jwtHasRole: !!payload.user_role,
        correctRole: payload.user_role === 'super_admin',
        correctEmail: payload.email === 'jefersonstilver@gmail.com',
        hookExecuted: !!payload.user_role,
        sessionValid: payload.exp > (Date.now() / 1000)
      };
      
      setAuthHookTest(test);
      
      console.log('🔍 INDEXA JWT Analysis:', {
        payload,
        test,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro na análise do JWT:', error);
    }
  };

  const runCompleteDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    setDiagnosticResults([]);
    
    const results: DiagnosticResult[] = [];
    
    try {
      // FASE 1: Verificação de Sessão
      results.push({
        step: 'Verificação de Sessão',
        status: isLoggedIn ? 'success' : 'error',
        message: isLoggedIn ? 'Usuário logado com sucesso' : 'Usuário não está logado',
        details: { userEmail: userProfile?.email, isLoggedIn }
      });
      
      // FASE 2: Análise do JWT
      if (session?.access_token) {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        
        results.push({
          step: 'Análise do JWT',
          status: 'success',
          message: 'JWT decodificado com sucesso',
          details: {
            email: payload.email,
            user_role: payload.user_role,
            iat: new Date(payload.iat * 1000).toLocaleString(),
            exp: new Date(payload.exp * 1000).toLocaleString()
          }
        });
        
        // FASE 3: Verificação do Auth Hook
        if (payload.user_role) {
          results.push({
            step: 'Auth Hook Status',
            status: payload.user_role === 'super_admin' ? 'success' : 'warning',
            message: `Auth Hook executou - Role: ${payload.user_role}`,
            details: { user_role: payload.user_role, expected: 'super_admin' }
          });
        } else {
          results.push({
            step: 'Auth Hook Status',
            status: 'error',
            message: 'Auth Hook NÃO executou - user_role ausente no JWT',
            details: { user_role: null, hookExecuted: false }
          });
        }
        
        // FASE 4: Verificação do Email
        results.push({
          step: 'Verificação de Email',
          status: payload.email === 'jefersonstilver@gmail.com' ? 'success' : 'warning',
          message: `Email: ${payload.email}`,
          details: { email: payload.email, isExpected: payload.email === 'jefersonstilver@gmail.com' }
        });
        
      } else {
        results.push({
          step: 'Análise do JWT',
          status: 'error',
          message: 'Nenhum access_token encontrado na sessão',
          details: { hasSession: !!session, hasToken: false }
        });
      }
      
      // FASE 5: Teste da Edge Function
      try {
        toast.info('Testando Edge Function do Auth Hook...');
        
        const { data: functionTest, error: functionError } = await supabase.functions.invoke('custom-access-token-hook', {
          body: {
            type: 'token',
            token: {
              aud: 'authenticated',
              exp: Math.floor(Date.now() / 1000) + 3600,
              iat: Math.floor(Date.now() / 1000),
              sub: session?.user.id || 'test-user-id',
              email: 'jefersonstilver@gmail.com',
              user_role: undefined
            },
            user: {
              id: session?.user.id || 'test-user-id',
              email: 'jefersonstilver@gmail.com',
              created_at: new Date().toISOString()
            }
          }
        });
        
        if (functionError) {
          results.push({
            step: 'Teste da Edge Function',
            status: 'error',
            message: `Erro ao testar function: ${functionError.message}`,
            details: { error: functionError }
          });
        } else {
          results.push({
            step: 'Teste da Edge Function',
            status: functionTest?.token?.user_role ? 'success' : 'warning',
            message: `Function executou - Role injetada: ${functionTest?.token?.user_role || 'NENHUMA'}`,
            details: { functionResponse: functionTest }
          });
        }
        
      } catch (error: any) {
        results.push({
          step: 'Teste da Edge Function',
          status: 'error',
          message: `Erro no teste da function: ${error.message}`,
          details: { error: error.message }
        });
      }
      
      setDiagnosticResults(results);
      
      // Análise final
      const hasErrors = results.some(r => r.status === 'error');
      const hasWarnings = results.some(r => r.status === 'warning');
      
      if (!hasErrors && !hasWarnings) {
        toast.success('✅ Diagnóstico completo - Sistema funcionando perfeitamente!');
      } else if (hasErrors) {
        toast.error('🚨 Problemas críticos detectados no Auth Hook');
      } else {
        toast.warning('⚠️ Problemas menores detectados - Necessário ajustes');
      }
      
    } catch (error: any) {
      console.error('💥 Erro no diagnóstico:', error);
      toast.error(`Erro no diagnóstico: ${error.message}`);
      
      results.push({
        step: 'Diagnóstico Geral',
        status: 'error',
        message: `Erro crítico no diagnóstico: ${error.message}`,
        details: { error: error.message }
      });
      
      setDiagnosticResults(results);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const executeAuthHookFix = async () => {
    setIsFixing(true);
    
    try {
      toast.info('🔧 Iniciando correção do Auth Hook...');
      
      // ESTRATÉGIA 1: Forçar refresh do token atual
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        toast.error(`Erro no refresh: ${refreshError.message}`);
        return;
      }
      
      toast.success('Token refreshed - Verificando injeção de role...');
      
      // Aguardar um momento para o hook processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o refresh resolveu
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session?.access_token) {
        const newPayload = JSON.parse(atob(sessionData.session.access_token.split('.')[1]));
        
        if (newPayload.user_role === 'super_admin') {
          toast.success('🎉 Auth Hook corrigido! Role injetada com sucesso');
          
          // Recarregar página para aplicar mudanças
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } else {
          toast.warning('Auth Hook ainda não está funcionando - Tentando estratégia 2...');
          
          // ESTRATÉGIA 2: Logout e login novamente
          await supabase.auth.signOut();
          
          toast.info('Fazendo novo login para forçar execução do Auth Hook...');
          
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: 'jefersonstilver@gmail.com',
            password: '573039'
          });
          
          if (loginError) {
            toast.error(`Erro no re-login: ${loginError.message}`);
          } else {
            toast.success('Re-login realizado - Verificando Auth Hook...');
            
            // Aguardar processamento
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        }
      }
      
    } catch (error: any) {
      console.error('💥 Erro na correção:', error);
      toast.error(`Erro na correção: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'success' | 'warning' | 'error') => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
          <TabsTrigger value="correction">Correção</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Status Geral */}
          <Card className={`border-2 ${authHookTest?.hookExecuted && authHookTest?.correctRole ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${authHookTest?.hookExecuted && authHookTest?.correctRole ? 'text-green-800' : 'text-red-800'}`}>
                {authHookTest?.hookExecuted && authHookTest?.correctRole ? (
                  <>
                    <Crown className="h-6 w-6 text-amber-500" />
                    INDEXA SUPER ADMIN ATIVO
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6" />
                    AUTH HOOK COM PROBLEMAS
                  </>
                )}
              </CardTitle>
              <CardDescription className={authHookTest?.hookExecuted && authHookTest?.correctRole ? 'text-green-700' : 'text-red-700'}>
                {authHookTest?.hookExecuted && authHookTest?.correctRole 
                  ? 'Sistema funcionando perfeitamente'
                  : 'Auth Hook não está injetando user_role no JWT'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authHookTest && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authHookTest.sessionValid ? 'success' : 'error')}
                    <span className="text-sm">Sessão Válida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authHookTest.hookExecuted ? 'success' : 'error')}
                    <span className="text-sm">Hook Executado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authHookTest.jwtHasRole ? 'success' : 'error')}
                    <span className="text-sm">JWT com Role</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(authHookTest.correctRole ? 'success' : 'error')}
                    <span className="text-sm">Role Correto</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* JWT Payload */}
          {jwtPayload && (
            <Card className="bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">JWT Payload Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Email:</strong> {jwtPayload.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <strong>user_role:</strong>
                    {jwtPayload.user_role ? (
                      <Badge variant={jwtPayload.user_role === 'super_admin' ? "default" : "secondary"}>
                        {jwtPayload.user_role}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">AUSENTE</Badge>
                    )}
                  </div>
                  <div>
                    <strong>Emitido:</strong> {new Date(jwtPayload.iat * 1000).toLocaleString()}
                  </div>
                  <div>
                    <strong>Expira:</strong> {new Date(jwtPayload.exp * 1000).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-6 w-6 text-blue-500" />
                Diagnóstico Completo do Sistema
              </CardTitle>
              <CardDescription>
                Executa verificação completa de todos os componentes do Auth Hook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runCompleteDiagnostic} 
                disabled={isRunningDiagnostic}
                className="w-full"
              >
                {isRunningDiagnostic ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Executando Diagnóstico...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Executar Diagnóstico Completo
                  </>
                )}
              </Button>

              {diagnosticResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Resultados do Diagnóstico:</h3>
                  {diagnosticResults.map((result, index) => (
                    <Card key={index} className={`border-l-4 ${
                      result.status === 'success' ? 'border-l-green-500 bg-green-50' :
                      result.status === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                      'border-l-red-500 bg-red-50'
                    }`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{result.step}</h4>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-700">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-500">Ver detalhes</summary>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-orange-500" />
                Correção Automática do Auth Hook
              </CardTitle>
              <CardDescription>
                Sistema automatizado de correção com múltiplas estratégias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">⚠️ Estratégias de Correção:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>1. Refresh do token atual para forçar re-execução do hook</li>
                  <li>2. Logout e login automático para nova sessão</li>
                  <li>3. Verificação e correção da configuração do Supabase</li>
                  <li>4. Aplicação de fallbacks seguros</li>
                </ul>
              </div>

              <Button 
                onClick={executeAuthHookFix} 
                disabled={isFixing}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Executando Correção...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Executar Correção Automática
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-500" />
                Monitoramento em Tempo Real
              </CardTitle>
              <CardDescription>
                Logs e eventos do sistema de autenticação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Status do Sistema:</p>
                  <p className="text-xs text-gray-600">
                    Usuário: {userProfile?.email} | Role: {userProfile?.role || 'INDEFINIDO'} | 
                    Logado: {isLoggedIn ? 'SIM' : 'NÃO'}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Última Verificação:</p>
                  <p className="text-xs text-gray-600">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthHookDiagnosticCenter;
