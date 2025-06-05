
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UserPlus, Edit, Trash2, Shield, User, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import SecureEmergencyPasswordReset from '@/components/admin/setup/SecureEmergencyPasswordReset';

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          <div className="flex gap-2">
            <Button onClick={fetchUsers} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={checkDataIntegrity} variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Verificar Integridade
            </Button>
          </div>
        </div>

        {/* Secure Emergency Reset Component */}
        <SecureEmergencyPasswordReset />

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Carregando usuários...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'super_admin' && <Shield className="h-3 w-3 mr-1" />}
                          {user.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                          {user.role === 'client' && <User className="h-3 w-3 mr-1" />}
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.data_criacao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
