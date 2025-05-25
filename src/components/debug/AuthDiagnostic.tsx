
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Crown, Shield } from 'lucide-react';

export const AuthDiagnostic = () => {
  const { userProfile, isLoggedIn, session } = useAuth();
  const [jwtAnalysis, setJwtAnalysis] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    if (session?.access_token) {
      analyzeCurrentAuth();
    }
  }, [session]);

  const analyzeCurrentAuth = () => {
    try {
      // Decodificar JWT atual
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      
      const analysis = {
        email: payload.email,
        user_role: payload.user_role,
        sub: payload.sub,
        iat: new Date(payload.iat * 1000).toLocaleString(),
        exp: new Date(payload.exp * 1000).toLocaleString(),
        isValid: payload.exp > (Date.now() / 1000),
        authHookWorking: !!payload.user_role,
        isSuperAdmin: payload.user_role === 'super_admin',
        expectedEmail: payload.email === 'jefersonstilver@gmail.com'
      };

      setJwtAnalysis(analysis);

      // Verificar status geral
      const status = {
        jwtHasRole: !!payload.user_role,
        correctRole: payload.user_role === 'super_admin',
        correctEmail: payload.email === 'jefersonstilver@gmail.com',
        profileRoleMatch: userProfile?.role === payload.user_role,
        shouldBeSuperAdmin: payload.email === 'jefersonstilver@gmail.com',
        systemWorking: payload.user_role === 'super_admin' && payload.email === 'jefersonstilver@gmail.com'
      };

      setAuthStatus(status);

      console.log('🔍 INDEXA AUTH DIAGNOSTIC:', {
        jwtAnalysis: analysis,
        authStatus: status,
        userProfile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro na análise do JWT:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Usuário não logado</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Geral */}
      <Card className={`border-2 ${authStatus?.systemWorking ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${authStatus?.systemWorking ? 'text-green-800' : 'text-red-800'}`}>
            {authStatus?.systemWorking ? (
              <>
                <Crown className="h-6 w-6 text-amber-500" />
                INDEXA SUPER ADMIN ATIVO
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6" />
                SISTEMA DE AUTH COM PROBLEMAS
              </>
            )}
          </CardTitle>
          <CardDescription className={authStatus?.systemWorking ? 'text-green-700' : 'text-red-700'}>
            {authStatus?.systemWorking 
              ? 'Auth Hook funcionando - Super Admin detectado'
              : 'Auth Hook NÃO está injetando user_role no JWT'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              {authStatus?.jwtHasRole ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">JWT contém user_role</span>
            </div>
            <div className="flex items-center gap-2">
              {authStatus?.correctRole ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Role = super_admin</span>
            </div>
            <div className="flex items-center gap-2">
              {authStatus?.correctEmail ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Email correto</span>
            </div>
            <div className="flex items-center gap-2">
              {authStatus?.profileRoleMatch ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">Profile sincronizado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise do JWT */}
      {jwtAnalysis && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">Análise Detalhada do JWT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Email:</strong> {jwtAnalysis.email}
              </div>
              <div className="flex items-center gap-2">
                <strong>user_role:</strong>
                {jwtAnalysis.user_role ? (
                  <Badge variant={jwtAnalysis.isSuperAdmin ? "default" : "secondary"}>
                    {jwtAnalysis.user_role}
                  </Badge>
                ) : (
                  <Badge variant="destructive">AUSENTE</Badge>
                )}
              </div>
              <div>
                <strong>Emitido em:</strong> {jwtAnalysis.iat}
              </div>
              <div>
                <strong>Expira em:</strong> {jwtAnalysis.exp}
              </div>
              <div className="col-span-2">
                <strong>Auth Hook Status:</strong>
                <Badge variant={jwtAnalysis.authHookWorking ? "default" : "destructive"} className="ml-2">
                  {jwtAnalysis.authHookWorking ? 'FUNCIONANDO' : 'NÃO EXECUTOU'}
                </Badge>
              </div>
            </div>

            {!jwtAnalysis.authHookWorking && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-800 font-bold">🚨 PROBLEMA IDENTIFICADO:</p>
                <p className="text-red-700">
                  O Auth Hook do Supabase NÃO está executando. O JWT não contém o claim 'user_role'.
                  Isso significa que a configuração do Hook precisa ser verificada no painel do Supabase.
                </p>
              </div>
            )}

            {jwtAnalysis.authHookWorking && !jwtAnalysis.isSuperAdmin && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-yellow-800 font-bold">⚠️ ROLE INCORRETA:</p>
                <p className="text-yellow-700">
                  Auth Hook está funcionando mas a role '{jwtAnalysis.user_role}' está incorreta.
                  Para {jwtAnalysis.email} deveria ser 'super_admin'.
                </p>
              </div>
            )}

            {jwtAnalysis.authHookWorking && jwtAnalysis.isSuperAdmin && (
              <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                <p className="text-green-800 font-bold">✅ TUDO CORRETO:</p>
                <p className="text-green-700">
                  Auth Hook funcionando perfeitamente! JWT contém user_role: super_admin.
                  O usuário deveria ter acesso completo ao painel administrativo.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Profile State */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Estado do UserProfile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Email:</strong> {userProfile?.email}</div>
            <div><strong>Role:</strong> {userProfile?.role}</div>
            <div><strong>ID:</strong> {userProfile?.id}</div>
            <div><strong>Data Criação:</strong> {userProfile?.data_criacao}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDiagnostic;
