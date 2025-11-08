import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Calendar, User, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuditLogTable from '@/components/admin/audit/AuditLogTable';
import { useSuperAdminProtection } from '@/hooks/useSuperAdminProtection';
import { Navigate } from 'react-router-dom';

interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id?: string | null;
  action_description?: string | null;
  metadata?: any;
  created_at: string;
  users?: {
    email: string;
    role: string;
  };
}

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

const AuditPage = () => {
  const { isSuperAdmin } = useSuperAdminProtection();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Proteção de acesso
  if (!isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .in('role', ['admin', 'admin_marketing', 'admin_financeiro', 'super_admin'])
        .order('email');

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários administrativos:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('user_activity_logs')
        .select(`
          *,
          users!inner (
            email,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      // Filtrar por usuário específico
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      // Filtrar por ação
      if (selectedAction !== 'all') {
        query = query.eq('action_type', selectedAction);
      }

      // Filtrar por admin_financeiro especificamente
      if (selectedUser === 'financial_only') {
        query = query.eq('users.role', 'admin_financeiro');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por termo de busca no frontend
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter((log) =>
          log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setLogs(filteredData);
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedAction]);

  // Buscar quando o usuário parar de digitar
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (selectedUser || selectedAction !== 'all') {
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleRefresh = () => {
    toast.info('Atualizando logs...');
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Auditoria do Sistema</h1>
              <p className="text-sm text-slate-600">
                Rastreamento completo de ações administrativas
              </p>
            </div>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre os registros de auditoria por usuário, ação ou termo de busca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por usuário */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Usuário
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    <SelectItem value="financial_only">
                      🟢 Apenas Admins Financeiros
                    </SelectItem>
                    {adminUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.role === 'admin_financeiro' ? '💰' : '👤'}{' '}
                        {user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por ação */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ação
                </label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="view">👁️ Visualização</SelectItem>
                    <SelectItem value="create">➕ Criação</SelectItem>
                    <SelectItem value="update">✏️ Atualização</SelectItem>
                    <SelectItem value="delete">🗑️ Exclusão</SelectItem>
                    <SelectItem value="export">📥 Exportação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Busca por termo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <Input
                  placeholder="Tipo de entidade, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-slate-900">{logs.length}</div>
              <div className="text-sm text-slate-600">Total de Registros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter((l) => l.action_type === 'create').length}
              </div>
              <div className="text-sm text-slate-600">Criações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter((l) => l.action_type === 'update').length}
              </div>
              <div className="text-sm text-slate-600">Atualizações</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter((l) => l.action_type === 'delete').length}
              </div>
              <div className="text-sm text-slate-600">Exclusões</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de logs */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>
              Histórico detalhado de todas as ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogTable logs={logs} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditPage;
