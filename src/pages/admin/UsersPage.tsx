import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Users, Database, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IndexaTeamSection from '@/components/admin/users/IndexaTeamSection';
import ClientsSection from '@/components/admin/users/ClientsSection';
import SystemHealthDashboard from '@/components/admin/users/SystemHealthDashboard';
interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  raw_user_meta_data?: any;
  banned_until?: string;
}
const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('indexa');
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 USERS PAGE: Buscando todos os usuários do Supabase...');

      // Buscar dados da tabela users (nossa tabela)
      const {
        data: usersData,
        error: usersError
      } = await supabase.from('users').select('*').order('data_criacao', {
        ascending: false
      });
      if (usersError) {
        console.error('❌ ERRO ao buscar usuários:', usersError);
        toast.error('Erro ao carregar usuários');
        return;
      }

      // Buscar dados adicionais do auth.users para cada usuário
      const enrichedUsers = await Promise.all((usersData || []).map(async user => {
        try {
          const {
            data: authData,
            error: authError
          } = await supabase.auth.admin.getUserById(user.id);
          if (authError) {
            console.warn(`Erro ao buscar dados auth para ${user.email}:`, authError);
            return {
              ...user,
              email_confirmed_at: null,
              last_sign_in_at: null,
              raw_user_meta_data: {},
              banned_until: null
            };
          }
          return {
            ...user,
            email_confirmed_at: authData.user?.email_confirmed_at,
            last_sign_in_at: authData.user?.last_sign_in_at,
            raw_user_meta_data: authData.user?.user_metadata || {},
            banned_until: authData.user?.user_metadata?.banned_until
          };
        } catch (error) {
          console.warn(`Erro ao enriquecer dados para ${user.email}:`, error);
          return {
            ...user,
            email_confirmed_at: null,
            last_sign_in_at: null,
            raw_user_meta_data: {},
            banned_until: null
          };
        }
      }));
      console.log('✅ USUÁRIOS CARREGADOS E ENRIQUECIDOS:', enrichedUsers.length, enrichedUsers);
      setUsers(enrichedUsers);
      toast.success(`${enrichedUsers.length} usuários carregados com sucesso`);
    } catch (error) {
      console.error('💥 ERRO CRÍTICO:', error);
      toast.error('Erro crítico ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  const indexaTeam = users.filter(user => user.role === 'super_admin' || user.role === 'admin' || user.role === 'admin_marketing');
  const clients = users.filter(user => user.role === 'client');
  const totalStats = {
    total: users.length,
    indexaTeam: indexaTeam.length,
    clients: clients.length,
    verified: users.filter(u => u.email_confirmed_at).length
  };
  return <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="h-8 w-8 mr-3 text-indexa-purple" />
            Sistema de Gestão de Usuários
          </h1>
          <p className="text-gray-600 mt-2">
            Gestão completa da equipe INDEXA e base de clientes
          </p>
        </div>
      </div>

      {/* Status da Conexão e Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">usuários no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe INDEXA</CardTitle>
            <Crown className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indexa-purple">{totalStats.indexaTeam}</div>
            <p className="text-xs text-gray-500 mt-1">administradores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{totalStats.clients}</div>
            <p className="text-xs text-gray-500 mt-1">clientes ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Separação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Diagnóstico do Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="indexa" className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>Equipe INDEXA ({indexaTeam.length})</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Base de Clientes ({clients.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="indexa" className="mt-6">
          <IndexaTeamSection users={users} loading={loading} onRefresh={fetchUsers} />
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <ClientsSection users={users} loading={loading} onRefresh={fetchUsers} />
        </TabsContent>
      </Tabs>
    </div>;
};
export default UsersPage;