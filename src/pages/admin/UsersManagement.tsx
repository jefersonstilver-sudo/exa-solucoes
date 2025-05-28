
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Crown, 
  Shield, 
  UserCheck, 
  RefreshCw,
  Database,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import UserManagementPanel from '@/components/admin/users/UserManagementPanel';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('👥 Buscando todos os usuários...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        toast.error('Erro ao carregar usuários');
        return;
      }

      console.log('✅ Usuários carregados:', data?.length, data);
      setUsers(data || []);
      toast.success(`${data?.length || 0} usuários carregados com sucesso`);
    } catch (error) {
      console.error('💥 Erro crítico:', error);
      toast.error('Erro crítico ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    admins: users.filter(u => u.role === 'admin').length,
    clients: users.filter(u => u.role === 'client').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center">
            <Users className="h-8 w-8 mr-3 text-indexa-purple" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <Database className="h-4 w-4 mr-2 text-indexa-purple" />
            Conectado ao Supabase • {stats.total} usuários registrados
          </p>
        </div>
      </div>

      {/* Status da conexão */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Conectado ao Supabase com Sucesso!</h3>
              <p className="text-green-700 text-sm">
                {stats.total} usuários carregados: {stats.superAdmins} super admins, {stats.admins} admins, {stats.clients} clientes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.superAdmins}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">{stats.clients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de gestão de usuários */}
      <UserManagementPanel 
        users={users} 
        loading={loading} 
        onRefresh={fetchUsers}
      />
    </div>
  );
};

export default UsersManagement;
