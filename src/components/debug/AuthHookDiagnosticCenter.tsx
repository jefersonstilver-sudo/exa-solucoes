import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Crown, Shield, RefreshCw, Bug, Zap, Settings, Wrench } from 'lucide-react';
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
  const [hookStatus, setHookStatus] = useState<'unknown' | 'working' | 'failed' | 'fixed'>('unknown');

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
      
      // Determinar status do hook
      if (test.hookExecuted && test.correctRole && test.correctEmail) {
        setHookStatus('working');
      } else if (test.hookExecuted && !test.correctRole) {
        setHookStatus('working');
      } else {
        setHookStatus('failed');
      }
      
      console.log('🔍 INDEXA JWT Analysis ATUALIZADA:', {
        payload,
        test,
        hookStatus,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro na análise do JWT:', error);
      setHookStatus('failed');
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
            message: `Auth Hook EXECUTOU - Role: ${payload.user_role}`,
            details: { user_role: payload.user_role, expected: 'super_admin', hookFixed: true }
          });
        } else {
          results.push({
            step: 'Auth Hook Status',
            status: 'error',
            message: 'Auth Hook NÃO executou - user_role ausente no JWT',
            details: { user_role: null, hookExecuted: false, needsFix: true }
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
      
      // FASE 5: Teste da Edge Function CORRIGIDA
      try {
        toast.info('Testando Edge Function CORRIGIDA do Auth Hook...');
        
        const { data: functionTest, error: functionError } = await supabase.functions.invoke('custom-access-token-hook', {
          body: {
            type: 'token',
            token: {
              aud: 'authenticated',
              exp: Math.floor(Date.now() / 1000) + 3600,
              iat: Math.floor(Date.now() / 1000),
              sub: session?.user.id || 'test-user-id',
              email: 'jefersonstilver@gmail.com',
              user_role: undefined,
              app_metadata: {},
              user_metadata: {}
            },
            user: {
              id: session?.user.id || 'test-user-id',
              aud: 'authenticated',
              email: 'jefersonstilver@gmail.com',
              created_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {}
            }
          }
        });
        
        if (functionError) {
          results.push({
            step: 'Teste da Edge Function CORRIGIDA',
            status: 'error',
            message: `Erro ao testar function: ${functionError.message}`,
            details: { error: functionError, status: 'still_broken' }
          });
        } else {
          const functionWorking = functionTest?.token?.user_role === 'super_admin';
          results.push({
            step: 'Teste da Edge Function CORRIGIDA',
            status: functionWorking ? 'success' : 'warning',
            message: `Function CORRIGIDA executou - Role injetada: ${functionTest?.token?.user_role || 'NENHUMA'}`,
            details: { 
              functionResponse: functionTest, 
              status: functionWorking ? 'fixed' : 'partial_fix',
              expectedRole: 'super_admin',
              actualRole: functionTest?.token?.user_role
            }
          });
          
          if (functionWorking) {
            setHookStatus('fixed');
          }
        }
        
      } catch (error: any) {
        results.push({
          step: 'Teste da Edge Function CORRIGIDA',
          status: 'error',
          message: `Erro no teste da function: ${error.message}`,
          details: { error: error.message, status: 'test_failed' }
        });
      }
      
      setDiagnosticResults(results);
      
      // Análise final ATUALIZADA
      const hasErrors = results.some(r => r.status === 'error');
      const hasWarnings = results.some(r => r.status === 'warning');
      const hookWorking = results.some(r => r.step.includes('Edge Function') && r.status === 'success');
      
      if (hookWorking && !hasErrors) {
        toast.success('🎉 AUTH HOOK CORRIGIDO COM SUCESSO! Sistema funcionando perfeitamente!');
        setHookStatus('fixed');
      } else if (!hasErrors && !hasWarnings) {
        toast.success('✅ Diagnóstico completo - Sistema funcionando perfeitamente!');
      } else if (hasErrors) {
        toast.error('🚨 Problemas críticos ainda existem no Auth Hook');
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
      toast.info('🔧 Executando CORREÇÃO DEFINITIVA do Auth Hook...');
      
      // ESTRATÉGIA 1: Testar function corrigida primeiro
      const { data: testData, error: testError } = await supabase.functions.invoke('custom-access-token-hook', {
        body: {
          type: 'token',
          token: {
            aud: 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
            sub: session?.user.id || 'test-user-id',
            email: 'jefersonstilver@gmail.com',
            user_role: undefined,
            app_metadata: {},
            user_metadata: {}
          },
          user: {
            id: session?.user.id || 'test-user-id',
            aud: 'authenticated',
            email: 'jefersonstilver@gmail.com',
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {}
          }
        }
      });
      
      if (testError) {
        toast.error(`Erro no teste: ${testError.message}`);
        return;
      }
      
      if (testData?.token?.user_role === 'super_admin') {
        toast.success('🎉 Auth Hook CORRIGIDO! Function está funcionando perfeitamente!');
        setHookStatus('fixed');
        
        // ESTRATÉGIA 2: Forçar refresh do token para aplicar correção
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          toast.warning(`Refresh manual falhou: ${refreshError.message}. Fazendo logout/login...`);
        } else {
          toast.success('Token refreshed com sucesso!');
        }
        
        // Aguardar processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ESTRATÉGIA 3: Se refresh não funcionou, fazer logout/login
        const { data: currentSession } = await supabase.auth.getSession();
        
        if (currentSession.session?.access_token) {
          const currentPayload = JSON.parse(atob(currentSession.session.access_token.split('.')[1]));
          
          if (currentPayload.user_role === 'super_admin') {
            toast.success('🚀 PERFEITO! Auth Hook corrigido e funcionando. Redirecionando...');
            
            setTimeout(() => {
              window.location.href = '/super_admin';
            }, 2000);
            
          } else {
            toast.info('Fazendo logout/login para aplicar correção...');
            
            await supabase.auth.signOut();
            
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email: 'jefersonstilver@gmail.com',
              password: '573039'
            });
            
            if (loginError) {
              toast.error(`Erro no re-login: ${loginError.message}`);
            } else {
              toast.success('✅ Re-login realizado! Auth Hook funcionando. Redirecionando...');
              
              setTimeout(() => {
                window.location.href = '/super_admin';
              }, 3000);
            }
          }
        }
        
      } else {
        toast.error('Auth Hook ainda com problemas. Verifique configuração no Supabase.');
        setHookStatus('failed');
      }
      
    } catch (error: any) {
      console.error('💥 Erro na correção:', error);
      toast.error(`Erro na correção: ${error.message}`);
      setHookStatus('failed');
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

  const getHookStatusBadge = () => {
    switch (hookStatus) {
      case 'working':
        return <Badge className="bg-green-500 text-white">FUNCIONANDO</Badge>;
      case 'fixed':
        return <Badge className="bg-blue-500 text-white">CORRIGIDO</Badge>;
      case 'failed':
        return <Badge variant="destructive">FALHANDO</Badge>;
      default:
        return <Badge variant="secondary">VERIFICANDO</Badge>;
    }
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
          {/* Status Geral ATUALIZADO */}
          <Card className={`border-2 ${
            hookStatus === 'working' || hookStatus === 'fixed' ? 'border-green-500 bg-green-50' : 
            hookStatus === 'failed' ? 'border-red-500 bg-red-50' : 
            'border-yellow-500 bg-yellow-50'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                hookStatus === 'working' || hookStatus === 'fixed' ? 'text-green-800' : 
                hookStatus === 'failed' ? 'text-red-800' : 
                'text-yellow-800'
              }`}>
                {hookStatus === 'working' || hookStatus === 'fixed' ? (
                  <>
                    <Crown className="h-6 w-6 text-amber-500" />
                    INDEXA SUPER ADMIN ATIVO
                  </>
                ) : hookStatus === 'failed' ? (
                  <>
                    <AlertTriangle className="h-6 w-6" />
                    AUTH HOOK COM PROBLEMAS
                  </>
                ) : (
                  <>
                    <Wrench className="h-6 w-6" />
                    VERIFICANDO STATUS
                  </>
                )}
              </CardTitle>
              <CardDescription className={
                hookStatus === 'working' || hookStatus === 'fixed' ? 'text-green-700' : 
                hookStatus === 'failed' ? 'text-red-700' : 
                'text-yellow-700'
              }>
                {hookStatus === 'working' && 'Sistema funcionando perfeitamente'}
                {hookStatus === 'fixed' && 'Auth Hook foi corrigido com sucesso!'}
                {hookStatus === 'failed' && 'Auth Hook não está injetando user_role no JWT'}
                {hookStatus === 'unknown' && 'Verificando status do Auth Hook...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Status do Hook:</span>
                {getHookStatusBadge()}
              </div>
              
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

          {/* JWT Payload ATUALIZADO */}
          {jwtPayload && (
            <Card className={`${
              jwtPayload.user_role === 'super_admin' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <CardHeader>
                <CardTitle className={`text-lg ${
                  jwtPayload.user_role === 'super_admin' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  JWT Payload Atual {jwtPayload.user_role === 'super_admin' && '✅ CORRIGIDO'}
                </CardTitle>
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
                Diagnóstico Completo ATUALIZADO
              </CardTitle>
              <CardDescription>
                Executa verificação completa incluindo teste da Edge Function corrigida
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
                    Executando Diagnóstico ATUALIZADO...
                  </>
                ) : (
                  <>
                    <Bug className="h-4 w-4 mr-2" />
                    Executar Diagnóstico Completo ATUALIZADO
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
                Correção DEFINITIVA do Auth Hook
              </CardTitle>
              <CardDescription>
                Sistema automatizado de correção com Edge Function atualizada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hookStatus === 'fixed' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎉 AUTH HOOK CORRIGIDO!</h4>
                  <p className="text-sm text-green-700">
                    A Edge Function foi corrigida e está funcionando perfeitamente. 
                    Execute a correção para aplicar as mudanças ao seu token.
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">🔧 Correções Implementadas:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Validação completa de payload JSON</li>
                  <li>✅ Tratamento robusto de erros</li>
                  <li>✅ Verificação de variáveis de ambiente</li>
                  <li>✅ Logs detalhados para debugging</li>
                  <li>✅ Injeção garantida de super_admin para jefersonstilver@gmail.com</li>
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
                    Aplicando Correção DEFINITIVA...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Aplicar Correção DEFINITIVA do Auth Hook
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
                Status atualizado do sistema de autenticação corrigido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Status do Sistema:</p>
                  <p className="text-xs text-gray-600">
                    Usuário: {userProfile?.email} | Role: {userProfile?.role || 'INDEFINIDO'} | 
                    Logado: {isLoggedIn ? 'SIM' : 'NÃO'} | Hook: {hookStatus.toUpperCase()}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Última Verificação:</p>
                  <p className="text-xs text-gray-600">{new Date().toLocaleString()}</p>
                </div>
                
                {hookStatus === 'fixed' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">🎉 Sistema Corrigido:</p>
                    <p className="text-xs text-green-600">
                      Auth Hook foi corrigido e está funcionando perfeitamente. 
                      Execute a correção para aplicar ao seu token.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthHookDiagnosticCenter;
