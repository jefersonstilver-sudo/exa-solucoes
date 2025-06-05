
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
      console.log('🔄 Carregando usuários...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, data_criacao')
        .order('data_criacao', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        throw error;
      }
      
      console.log('✅ Usuários carregados:', data?.length || 0);
      setUsers(data || []);
      
    } catch (error: any) {
      console.error('💥 Erro crítico ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
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
