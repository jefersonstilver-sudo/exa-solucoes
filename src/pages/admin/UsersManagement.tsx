
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import UserManagementPanel from '@/components/admin/users/UserManagementPanel';
import PendingEmailConfirmations from '@/components/admin/users/PendingEmailConfirmations';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';
import { useUserStats } from '@/hooks/useUserStats';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import UserMobileList from '@/components/admin/users/UserMobileList';
import CreateUserDialog from '@/components/admin/users/CreateUserDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, RefreshCw, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

export default function UsersManagement() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useAdvancedResponsive();
  const { stats, loading: loadingStats, refetch: refetchStats } = useUserStats();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin or super_admin
  const isAdminUser = hasRole('admin') || hasRole('super_admin');

  if (!user || !isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Log detalhado do estado de autenticação
      console.log('🔄 [USERS_MANAGEMENT] Iniciando carregamento de usuários...');
      console.log('🔐 [AUTH_STATE]', {
        userId: user?.id,
        userEmail: user?.email,
        isAdmin: hasRole('admin'),
        isSuperAdmin: hasRole('super_admin'),
        hasPermission: isAdminUser
      });
      
      // Tentar carregar usuários do banco
      const { data, error, status, statusText } = await supabase
        .from('users')
        .select('id, email, role, data_criacao')
        .order('data_criacao', { ascending: false });
      
      // Log detalhado da resposta
      console.log('📦 [SUPABASE_RESPONSE]', {
        status,
        statusText,
        hasData: !!data,
        dataLength: data?.length || 0,
        hasError: !!error,
        error: error
      });
      
      if (error) {
        console.error('❌ [ERROR_DETAILS]', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Mensagem de erro mais específica
        if (error.code === 'PGRST301') {
          toast.error('Acesso negado: Você não tem permissão para ver os usuários');
        } else if (error.message.includes('JWT')) {
          toast.error('Sessão inválida. Faça login novamente.');
        } else {
          toast.error(`Erro ao carregar usuários: ${error.message}`);
        }
        
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.warn('⚠️ [WARNING] Nenhum usuário encontrado no banco');
        toast.warning('Nenhum usuário encontrado no sistema');
      } else {
        console.log('✅ [SUCCESS] Usuários carregados:', {
          total: data.length,
          roles: data.reduce((acc: any, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
          }, {})
        });
        toast.success(`${data.length} usuários carregados com sucesso`);
      }
      
      setUsers(data || []);
      
    } catch (error: any) {
      console.error('💥 [CRITICAL_ERROR] Erro ao carregar usuários:', {
        message: error?.message,
        stack: error?.stack,
        fullError: error
      });
      
      // Não mostrar toast duplicado se já foi mostrado acima
      if (!error?.code) {
        toast.error('Erro crítico ao carregar usuários. Verifique o console para detalhes.');
      }
    } finally {
      setLoading(false);
      console.log('🏁 [FINISH] Carregamento finalizado');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    loadUsers();
    refetchStats();
  };

  // Filtrar usuários
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] border-b border-white/10">
          <div className="px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Gestão de Usuários
                </h1>
                <p className="text-xs text-white/80">
                  Administre contas do sistema
                </p>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="flex-1 h-9 bg-white/10 hover:bg-white/20 text-white border-0 text-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Novo Admin
              </Button>
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="ghost"
                className="h-9 w-9 p-0 text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard de Estatísticas */}
        <div className="px-4 py-4 bg-white border-b">
          <UserStatsCards stats={stats} loading={loadingStats} />
        </div>

        {/* Barra de Busca */}
        <div className="px-4 py-3 bg-white border-b">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por email ou role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="px-4 py-3 bg-gray-50">
          {searchTerm && (
            <div className="mb-3 text-sm text-muted-foreground">
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}{' '}
              encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </div>
          )}
          <UserMobileList users={filteredUsers} isLoading={loading} onUserUpdated={handleRefresh} />
        </div>

        {/* Create User Dialog */}
        <CreateUserDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleRefresh}
        />
      </div>
    );
  }

  // Desktop View
  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerencie usuários e confirmações de email do sistema</p>
          
          {/* Debug Info - Remove in production */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">🔍 Debug Info:</p>
              <div className="space-y-1 text-blue-700">
                <p>User ID: {user?.id || 'N/A'}</p>
                <p>Email: {user?.email || 'N/A'}</p>
                <p>Is Admin: {hasRole('admin') ? '✅' : '❌'}</p>
                <p>Is Super Admin: {hasRole('super_admin') ? '✅' : '❌'}</p>
                <p>Users Loaded: {users.length}</p>
                <p>Loading: {loading ? '🔄' : '✅'}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Confirmações de Email Pendentes */}
        <PendingEmailConfirmations />
        
        {/* Painel de Gestão de Usuários */}
        <UserManagementPanel 
          users={users}
          loading={loading}
          onRefresh={loadUsers}
        />
      </div>
    </Layout>
  );
}
