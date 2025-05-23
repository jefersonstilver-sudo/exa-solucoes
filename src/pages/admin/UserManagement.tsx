
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Trash2, Shield, User, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import MasterAdminFixer from '@/components/admin/setup/MasterAdminFixer';

interface UserData {
  id: string;
  email: string;
  role: string;
  data_criacao: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkDataIntegrity = async () => {
    try {
      const { data, error } = await supabase.rpc('check_user_data_integrity');
      
      if (error) throw error;
      
      console.log('Verificação de integridade:', data);
      toast.success('Verificação de integridade concluída. Verifique o console.');
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      toast.error('Erro na verificação: ' + error.message);
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <ShieldCheck className="h-5 w-5 text-amber-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleEdit = (userId: string) => {
    navigate(`/admin/usuarios/editar/${userId}`);
  };
  
  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id === userId) {
        toast.error('Você não pode excluir seu próprio usuário!');
        return;
      }
      
      toast.error('Funcionalidade de exclusão ainda não implementada');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
    }
  };
  
  return (
    <AdminLayout title="Gerenciamento de Usuários" requireSuperAdmin={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
            <p className="text-muted-foreground">
              Sistema simplificado com trigger automático de sincronização
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={checkDataIntegrity}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Integridade
            </Button>
            
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/usuarios/novo')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>
        
        <Card className="p-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Ferramentas de Diagnóstico</h3>
            <MasterAdminFixer />
          </CardContent>
        </Card>
        
        <div className="border rounded-md shadow-sm bg-white dark:bg-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800 dark:border-white"></div>
                      <span className="ml-2">Carregando usuários...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.data_criacao)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(user.id, user.email)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
