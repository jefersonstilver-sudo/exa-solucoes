
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import UserManagementPanel from '@/components/admin/users/UserManagementPanel';
import PendingEmailConfirmations from '@/components/admin/users/PendingEmailConfirmations';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
