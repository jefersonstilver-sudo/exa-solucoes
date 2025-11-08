import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DebugPermissions() {
  const { userProfile, session, isLoading } = useAuth();
  const { permissions, userInfo } = useUserPermissions();
  const [dbRole, setDbRole] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [customPerms, setCustomPerms] = useState<any>(null);
  const [jwtPayload, setJwtPayload] = useState<any>(null);

  const loadDebugData = async () => {
    if (!userProfile?.id) return;

    // Buscar role da user_roles
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userProfile.id)
      .single();
    setDbRole(roleData);

    // Buscar dados da users
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userProfile.id)
      .single();
    setDbUser(userData);

    // Buscar permissões customizadas
    const { data: customData } = await supabase
      .from('user_custom_permissions')
      .select('*')
      .eq('user_id', userProfile.id)
      .maybeSingle();
    setCustomPerms(customData);

    // Decodificar JWT
    if (session?.access_token) {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        setJwtPayload(payload);
      } catch (err) {
        console.error('Erro ao decodificar JWT:', err);
      }
    }
  };

  useEffect(() => {
    loadDebugData();
  }, [userProfile?.id]);

  const handleRefresh = async () => {
    await supabase.auth.refreshSession();
    await loadDebugData();
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🐛 Debug de Permissões</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Recarregar Sessão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>👤 User Profile (useAuth)</CardTitle>
          <CardDescription>Dados do hook useAuth</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔑 JWT Payload</CardTitle>
          <CardDescription>Conteúdo do token JWT</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(jwtPayload, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🗄️ user_roles (Database)</CardTitle>
          <CardDescription>Dados da tabela user_roles</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(dbRole, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>👥 users (Database)</CardTitle>
          <CardDescription>Dados da tabela users</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {JSON.stringify(dbUser, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>⚙️ Custom Permissions (Database)</CardTitle>
          <CardDescription>Permissões customizadas da tabela user_custom_permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
            {customPerms ? JSON.stringify(customPerms, null, 2) : 'Nenhuma permissão customizada encontrada'}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>✅ Permissões Finais (useUserPermissions)</CardTitle>
          <CardDescription>Permissões computadas pelo hook</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Info:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Todas as Permissões:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(permissions, null, 2)}
              </pre>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h3 className="font-semibold text-yellow-800 mb-2">🎯 Permissão Crítica:</h3>
              <p className="text-sm">
                <span className="font-mono">canManageProviderBenefits</span>:{' '}
                <span className={`font-bold ${permissions.canManageProviderBenefits ? 'text-green-600' : 'text-red-600'}`}>
                  {permissions.canManageProviderBenefits ? '✅ TRUE' : '❌ FALSE'}
                </span>
              </p>
              <p className="text-sm mt-2">
                <span className="font-mono">canViewCRM</span>:{' '}
                <span className={`font-bold ${permissions.canViewCRM ? 'text-green-600' : 'text-red-600'}`}>
                  {permissions.canViewCRM ? '✅ TRUE' : '❌ FALSE'}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>📋 Checklist de Verificação</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className={dbRole?.role === 'admin_financeiro' ? 'text-green-600' : 'text-red-600'}>
              {dbRole?.role === 'admin_financeiro' ? '✅' : '❌'} Role na user_roles é admin_financeiro
            </li>
            <li className={dbUser?.role === 'admin_financeiro' ? 'text-green-600' : 'text-red-600'}>
              {dbUser?.role === 'admin_financeiro' ? '✅' : '❌'} Role na users é admin_financeiro
            </li>
            <li className={userProfile?.role === 'admin_financeiro' ? 'text-green-600' : 'text-red-600'}>
              {userProfile?.role === 'admin_financeiro' ? '✅' : '❌'} Role no userProfile é admin_financeiro
            </li>
            <li className={permissions.canManageProviderBenefits ? 'text-green-600' : 'text-red-600'}>
              {permissions.canManageProviderBenefits ? '✅' : '❌'} Tem permissão canManageProviderBenefits
            </li>
            <li className={!permissions.canViewCRM ? 'text-green-600' : 'text-red-600'}>
              {!permissions.canViewCRM ? '✅' : '❌'} NÃO tem permissão canViewCRM
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
