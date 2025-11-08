import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Save, RotateCcw, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCustomPermissions } from '@/hooks/useCustomPermissions';
import { getUserPermissions, UserPermissions, USER_PERMISSIONS } from '@/types/userTypes';
import type { UserRole } from '@/types/userTypes';
import { toast } from 'sonner';
import { getRoleDisplayInfo } from '@/services/userRoleService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserWithRole {
  id: string;
  email: string;
  nome?: string;
  role: UserRole;
}

const PERMISSION_CATEGORIES = {
  'Gestão Principal': [
    { key: 'canViewDashboard', label: 'Ver Dashboard' },
    { key: 'canViewOrders', label: 'Ver Pedidos' },
    { key: 'canViewCRM', label: 'Ver CRM Clientes' },
    { key: 'canViewApprovals', label: 'Ver Aprovações' },
  ],
  'Ativos': [
    { key: 'canManageBuildings', label: 'Gerenciar Prédios' },
    { key: 'canManagePanels', label: 'Gerenciar Painéis' },
  ],
  'Leads & Clientes': [
    { key: 'canViewLeads', label: 'Ver Leads' },
    { key: 'canViewSindicosInteressados', label: 'Ver Síndicos Interessados' },
    { key: 'canViewLeadsProdutora', label: 'Ver Leads Produtora' },
    { key: 'canViewLeadsCampanhas', label: 'Ver Leads Campanhas' },
  ],
  'Sistema': [
    { key: 'canManageUsers', label: 'Gerenciar Usuários' },
    { key: 'canManageCoupons', label: 'Gerenciar Cupons' },
    { key: 'canManageHomepageConfig', label: 'Gerenciar Config Homepage' },
    { key: 'canManageSystemSettings', label: 'Configurações do Sistema' },
    { key: 'canViewAudit', label: 'Ver Auditoria' },
    { key: 'canViewSecurity', label: 'Ver Segurança' },
  ],
  'Conteúdo': [
    { key: 'canManageVideos', label: 'Gerenciar Vídeos' },
    { key: 'canManagePortfolio', label: 'Gerenciar Portfólio' },
    { key: 'canManageNotifications', label: 'Gerenciar Notificações' },
  ],
  'Financeiro': [
    { key: 'canManageProviderBenefits', label: 'Gerenciar Benefícios Prestadores' },
    { key: 'canViewFinancialReports', label: 'Ver Relatórios Financeiros' },
  ],
};

export default function PermissionsManagementPage() {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [notes, setNotes] = useState('');
  const [permissions, setPermissions] = useState<Partial<UserPermissions>>({});
  const { saveCustomPermissions, resetPermissions, loadCustomPermissions } = useCustomPermissions();

  // Proteção: apenas super_admin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      toast.error('Acesso negado');
      navigate('/admin');
    }
  }, [isSuperAdmin, authLoading, navigate]);

  // Carregar usuários
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role')
        .order('email');

      if (error) throw error;

      setUsers(data as UserWithRole[]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Quando um usuário é selecionado, carregar suas permissões
  const handleSelectUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setSelectedUser(user);
    
    // Carregar permissões customizadas se existirem
    const customPerms = await loadCustomPermissions(userId);
    
    // Se não houver customizadas, usar as padrões do role
    const defaultPerms = getUserPermissions(user.role);
    setPermissions(customPerms || defaultPerms);
    setNotes('');
  };

  // Toggle de uma permissão específica
  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Salvar permissões
  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    const result = await saveCustomPermissions(selectedUser.id, permissions);
    if (result.success) {
      toast.success('Permissões salvas com sucesso');
    }
  };

  // Resetar para padrão do role
  const handleResetToRole = async () => {
    if (!selectedUser) return;

    const defaultPerms = getUserPermissions(selectedUser.role);
    setPermissions(defaultPerms);
    
    const result = await resetPermissions(selectedUser.id);
    if (result.success) {
      toast.success('Permissões resetadas para o padrão do role');
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
        </div>
        <p className="text-muted-foreground">
          Configure permissões customizadas para cada usuário. Permissões customizadas sobrescrevem as permissões padrão do role.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Usuários */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Selecionar Usuário</CardTitle>
            <CardDescription>Escolha um usuário para gerenciar permissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoadingUsers ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedUser?.id === user.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent border-border'
                    }`}
                  >
                    <div className="font-medium truncate">{user.nome || user.email}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    <Badge variant="outline" className="mt-1">
                      {getRoleDisplayInfo(user.role).label}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Editor de Permissões */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Editar Permissões</CardTitle>
            <CardDescription>
              {selectedUser ? (
                <>Editando permissões de: <strong>{selectedUser.nome || selectedUser.email}</strong></>
              ) : (
                'Selecione um usuário para editar suas permissões'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-6">
                {/* Info do Role Padrão */}
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Role Padrão: {getRoleDisplayInfo(selectedUser.role).label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      As permissões marcadas abaixo sobrescrevem as permissões padrão do role. 
                      Para voltar ao padrão, clique em "Resetar para Padrão".
                    </p>
                  </div>
                </div>

                {/* Permissões por Categoria */}
                {Object.entries(PERMISSION_CATEGORIES).map(([category, perms]) => (
                  <div key={category}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      {category}
                      <Separator className="flex-1" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {perms.map(({ key, label }) => {
                        const permKey = key as keyof UserPermissions;
                        const isChecked = permissions[permKey] === true;
                        
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={isChecked}
                              onCheckedChange={() => togglePermission(permKey)}
                            />
                            <Label
                              htmlFor={key}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {label}
                            </Label>
                            {isChecked && (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione uma nota explicando por que essas permissões foram alteradas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSavePermissions} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Permissões
                  </Button>
                  <Button onClick={handleResetToRole} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar para Padrão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um usuário na lista ao lado para começar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
