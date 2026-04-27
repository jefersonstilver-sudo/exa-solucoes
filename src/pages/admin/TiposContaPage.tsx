import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Settings, Megaphone, Wallet, Briefcase, User, Monitor,
  Plus, Pencil, Trash2, ChevronRight, Check, X, Loader2, ArrowLeft,
  Users, ShoppingCart, Copy, AlertTriangle, LayoutGrid
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import ModulePermissionsModal from '@/components/admin/account-types/ModulePermissionsModal';
import DeleteRoleTypeDialog from '@/components/admin/account-types/DeleteRoleTypeDialog';
import { useAuth } from '@/hooks/useAuth';

interface RoleType {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

interface RolePermission {
  id: string;
  role_key: string;
  permission_key: string;
  permission_label: string;
  permission_group: string;
  is_enabled: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  settings: Settings,
  megaphone: Megaphone,
  wallet: Wallet,
  briefcase: Briefcase,
  user: User,
  monitor: Monitor,
};

const iconOptions = [
  { key: 'shield', label: 'Escudo', Icon: Shield },
  { key: 'settings', label: 'Configurações', Icon: Settings },
  { key: 'megaphone', label: 'Marketing', Icon: Megaphone },
  { key: 'wallet', label: 'Financeiro', Icon: Wallet },
  { key: 'briefcase', label: 'Negócios', Icon: Briefcase },
  { key: 'user', label: 'Usuário', Icon: User },
  { key: 'monitor', label: 'Monitor', Icon: Monitor },
];

// Admin role keys that cannot make orders
const ADMIN_ROLE_KEYS = ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'painel'];

export default function TiposContaPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const currentUserRoleKey = userProfile?.role ?? null;
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [modulePermissionsRole, setModulePermissionsRole] = useState<RoleType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RoleType | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [newRole, setNewRole] = useState({
    key: '',
    display_name: '',
    description: '',
    color: '#9C1E1E',
    icon: 'user',
  });

  // Fetch role types
  const { data: roleTypes = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['role-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_types')
        .select('*')
        .order('is_system', { ascending: false })
        .order('display_name');
      
      if (error) throw error;
      return data as RoleType[];
    }
  });

  // Fetch user counts per role
  const { data: userCounts = {} } = useQuery({
    queryKey: ['user-counts-by-role'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('role');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(user => {
        counts[user.role] = (counts[user.role] || 0) + 1;
      });
      return counts;
    }
  });

  // Fetch permissions for selected role
  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole?.key],
    queryFn: async () => {
      if (!selectedRole) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_key', selectedRole.key)
        .order('permission_group')
        .order('permission_label');
      
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!selectedRole
  });

  // Group permissions
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, RolePermission[]> = {};
    permissions.forEach(p => {
      if (!groups[p.permission_group]) {
        groups[p.permission_group] = [];
      }
      groups[p.permission_group].push(p);
    });
    return groups;
  }, [permissions]);

  // Toggle permission mutation
  const togglePermission = useMutation({
    mutationFn: async ({ permissionId, isEnabled, permissionKey }: { permissionId: string; isEnabled: boolean; permissionKey: string }) => {
      // Block enabling can_make_orders for admin roles
      if (permissionKey === 'can_make_orders' && isEnabled && selectedRole && ADMIN_ROLE_KEYS.includes(selectedRole.key)) {
        throw new Error('Tipos administrativos não podem fazer pedidos por segurança.');
      }
      
      const { error } = await supabase
        .from('role_permissions')
        .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
        .eq('id', permissionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissão atualizada');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar permissão');
    }
  });

  // Create role mutation
  const createRole = useMutation({
    mutationFn: async () => {
      const roleKey = newRole.key.toLowerCase().replace(/\s+/g, '_');
      
      // Create role type
      const { data: roleData, error: roleError } = await supabase
        .from('role_types')
        .insert({
          key: roleKey,
          display_name: newRole.display_name,
          description: newRole.description,
          color: newRole.color,
          icon: newRole.icon,
          is_system: false,
          is_active: true,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;

      // Copy permissions from super_admin as template (all disabled except can_make_orders for client)
      const { data: templatePermissions } = await supabase
        .from('role_permissions')
        .select('permission_key, permission_label, permission_group')
        .eq('role_key', 'super_admin');

      if (templatePermissions && templatePermissions.length > 0) {
        const newPermissions = templatePermissions.map(p => ({
          role_key: roleData.key,
          permission_key: p.permission_key,
          permission_label: p.permission_label,
          permission_group: p.permission_group,
          is_enabled: false,
        }));

        await supabase.from('role_permissions').insert(newPermissions);
      }

      return roleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-types'] });
      setIsCreating(false);
      setNewRole({ key: '', display_name: '', description: '', color: '#9C1E1E', icon: 'user' });
      toast.success('Tipo de conta criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar tipo de conta');
    }
  });

  // Clone role mutation
  const cloneRole = useMutation({
    mutationFn: async (sourceRole: RoleType) => {
      const newKey = `${sourceRole.key}_copy_${Date.now()}`;
      
      // Create cloned role type
      const { data: roleData, error: roleError } = await supabase
        .from('role_types')
        .insert({
          key: newKey,
          display_name: `${sourceRole.display_name} (Cópia)`,
          description: sourceRole.description,
          color: sourceRole.color,
          icon: sourceRole.icon,
          is_system: false,
          is_active: true,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;

      // Copy permissions from source role
      const { data: sourcePermissions } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role_key', sourceRole.key);

      if (sourcePermissions && sourcePermissions.length > 0) {
        const clonedPermissions = sourcePermissions.map(p => ({
          role_key: roleData.key,
          permission_key: p.permission_key,
          permission_label: p.permission_label,
          permission_group: p.permission_group,
          is_enabled: p.is_enabled,
        }));

        await supabase.from('role_permissions').insert(clonedPermissions);
      }

      return roleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-types'] });
      toast.success('Tipo de conta clonado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao clonar tipo de conta');
    }
  });

  // Delete role mutation
  const deleteRole = useMutation({
    mutationFn: async (roleKey: string) => {
      // First delete permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_key', roleKey);
        
      const { error } = await supabase
        .from('role_types')
        .delete()
        .eq('key', roleKey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-types'] });
      setDeleteConfirm(null);
      setSelectedRole(null);
      toast.success('Tipo de conta removido');
    },
    onError: () => {
      toast.error('Erro ao remover tipo de conta');
    }
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const getCanMakeOrdersStatus = (roleKey: string) => {
    const canMakeOrdersPerm = permissions.find(p => p.permission_key === 'can_make_orders');
    if (!canMakeOrdersPerm) return ADMIN_ROLE_KEYS.includes(roleKey) ? false : true;
    return canMakeOrdersPerm.is_enabled;
  };

  // Mobile View
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="px-4 py-3 safe-area-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate('/super_admin/usuarios')}
                  className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold">Tipos de Conta</h1>
                  <p className="text-[11px] text-muted-foreground">{roleTypes.length} tipos cadastrados</p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreating(true)}
                size="sm"
                className="h-8 bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="p-3 space-y-2">
          {loadingRoles ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/80 rounded-xl p-4 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            roleTypes.map(role => {
              const Icon = iconMap[role.icon] || User;
              const userCount = userCounts[role.key] || 0;
              const isAdmin = ADMIN_ROLE_KEYS.includes(role.key);
              
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-md p-4"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => setSelectedRole(role)}
                    >
                      <div 
                        className="p-2.5 rounded-xl"
                        style={{ backgroundColor: `${role.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: role.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{role.display_name}</span>
                          {role.is_system && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                              Sistema
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {userCount} usuários
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                              <ShoppingCart className="h-3 w-3" />
                              🚫
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModulePermissionsRole(role);
                        }}
                      >
                        <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                        Módulos
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Role Detail Sheet */}
        <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-4 border-b bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {selectedRole && (
                  <>
                    <div 
                      className="p-2.5 rounded-xl"
                      style={{ backgroundColor: `${selectedRole.color}15` }}
                    >
                      {(() => {
                        const Icon = iconMap[selectedRole.icon] || User;
                        return <Icon className="h-5 w-5" style={{ color: selectedRole.color }} />;
                      })()}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedRole.display_name}</DialogTitle>
                      <DialogDescription className="text-xs">
                        {selectedRole.is_system ? 'Tipo de sistema' : 'Tipo customizado'} • {userCounts[selectedRole.key] || 0} usuários
                      </DialogDescription>
                    </div>
                  </>
                )}
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 p-4">
              {/* Can Make Orders Status */}
              {selectedRole && ADMIN_ROLE_KEYS.includes(selectedRole.key) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Não pode fazer pedidos</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Contas administrativas não podem realizar compras por segurança.
                  </p>
                </div>
              )}

              {/* Permissions */}
              {loadingPermissions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <Collapsible 
                      key={group}
                      open={expandedGroups.includes(group)}
                      onOpenChange={() => toggleGroup(group)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <span className="text-sm font-medium">{group}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {perms.filter(p => p.is_enabled).length}/{perms.length}
                            </Badge>
                            <ChevronRight className={`h-4 w-4 transition-transform ${expandedGroups.includes(group) ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-1 pl-2">
                          {perms.map(perm => {
                            const isBlocked = selectedRole?.key === 'super_admin' || 
                              (perm.permission_key === 'can_make_orders' && selectedRole && ADMIN_ROLE_KEYS.includes(selectedRole.key));
                            
                            return (
                              <div 
                                key={perm.id}
                                className={`flex items-center justify-between p-2.5 rounded-lg ${isBlocked ? 'bg-gray-100' : 'bg-white'}`}
                              >
                                <div className="flex-1">
                                  <span className="text-sm">{perm.permission_label}</span>
                                  {perm.permission_key === 'can_make_orders' && (
                                    <span className="ml-1.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                      CRÍTICA
                                    </span>
                                  )}
                                </div>
                                {isBlocked ? (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {selectedRole?.key === 'super_admin' ? 'Sempre ativo' : 'Bloqueado'}
                                  </Badge>
                                ) : (
                                  <Switch
                                    checked={perm.is_enabled}
                                    onCheckedChange={(checked) => 
                                      togglePermission.mutate({ 
                                        permissionId: perm.id, 
                                        isEnabled: checked,
                                        permissionKey: perm.permission_key
                                      })
                                    }
                                    disabled={togglePermission.isPending}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            {selectedRole && !selectedRole.is_system && (
              <div className="p-4 border-t bg-white/80 backdrop-blur-sm flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => cloneRole.mutate(selectedRole)}
                  disabled={cloneRole.isPending}
                >
                  <Copy className="h-4 w-4 mr-1.5" />
                  Clonar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(selectedRole)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Tipo de Conta</DialogTitle>
              <DialogDescription>
                Crie um novo tipo de conta com permissões personalizadas
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Tipo</label>
                <Input
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value, key: e.target.value })}
                  placeholder="Ex: Gestor de Vendas"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Descreva as responsabilidades..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Ícone</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {iconOptions.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewRole({ ...newRole, icon: key })}
                      className={`p-2.5 rounded-lg border-2 transition-all ${
                        newRole.icon === key 
                          ? 'border-[hsl(var(--exa-red))] bg-[hsl(var(--exa-red))]/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={label}
                    >
                      <Icon className="h-5 w-5" style={{ color: newRole.icon === key ? newRole.color : undefined }} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Cor do Tema</label>
                <div className="flex gap-2 mt-2">
                  {['#9C1E1E', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewRole({ ...newRole, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newRole.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createRole.mutate()}
                disabled={!newRole.display_name || createRole.isPending}
                className="bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
              >
                {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Tipo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation - Mobile */}
        <DeleteRoleTypeDialog
          role={deleteConfirm}
          currentUserRoleKey={currentUserRoleKey}
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          onDeleted={() => setSelectedRole(null)}
        />

        {/* Module Permissions Modal - Mobile */}
        {modulePermissionsRole && (
          <ModulePermissionsModal
            role={modulePermissionsRole}
            onClose={() => setModulePermissionsRole(null)}
          />
        )}
      </div>
    );
  }

  // Desktop View - Master-Detail Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/super_admin/usuarios')}
            className="h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[hsl(var(--exa-red))]/10 rounded-xl">
              <Settings className="h-5 w-5 text-[hsl(var(--exa-red))]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Tipos de Conta</h1>
              <p className="text-sm text-muted-foreground">{roleTypes.length} tipos cadastrados</p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Master - Role List */}
        <div className="col-span-4">
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium">Todos os Tipos</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="p-2 space-y-1">
                {loadingRoles ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  roleTypes.map(role => {
                    const Icon = iconMap[role.icon] || User;
                    const userCount = userCounts[role.key] || 0;
                    const isAdmin = ADMIN_ROLE_KEYS.includes(role.key);
                    const isSelected = selectedRole?.key === role.key;
                    
                    return (
                      <motion.div
                        key={role.id}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          isSelected 
                            ? 'bg-[hsl(var(--exa-red))]/10 border-2 border-[hsl(var(--exa-red))]/30' 
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedRole(role)}
                        >
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${role.color}15` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: role.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{role.display_name}</span>
                              {role.is_system && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">
                                  Sistema
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                {userCount} usuários
                              </span>
                              {isAdmin && (
                                <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                                  <ShoppingCart className="h-3 w-3" />
                                  🚫
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pl-10">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModulePermissionsRole(role);
                            }}
                          >
                            <LayoutGrid className="h-3 w-3 mr-1" />
                            Configurar Módulos
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Detail - Permissions Panel */}
        <div className="col-span-8">
          <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-md overflow-hidden h-[calc(100vh-220px)]">
            {!selectedRole ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-medium text-muted-foreground">Selecione um tipo de conta</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Clique em um tipo à esquerda para ver e editar suas permissões
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Detail Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: `${selectedRole.color}15` }}
                      >
                        {(() => {
                          const Icon = iconMap[selectedRole.icon] || User;
                          return <Icon className="h-6 w-6" style={{ color: selectedRole.color }} />;
                        })()}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{selectedRole.display_name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {selectedRole.description || 'Sem descrição'} • {userCounts[selectedRole.key] || 0} usuários
                        </p>
                      </div>
                    </div>
                    
                    {!selectedRole.is_system && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cloneRole.mutate(selectedRole)}
                          disabled={cloneRole.isPending}
                        >
                          <Copy className="h-4 w-4 mr-1.5" />
                          Clonar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm(selectedRole)}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Can Make Orders Warning */}
                  {ADMIN_ROLE_KEYS.includes(selectedRole.key) && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Este tipo não pode fazer pedidos</span>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Contas administrativas são bloqueadas de realizar compras por segurança do sistema.
                      </p>
                    </div>
                  )}
                </div>

                {/* Permissions Grid */}
                <ScrollArea className="h-[calc(100%-140px)]">
                  <div className="p-4 space-y-4">
                    {loadingPermissions ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      Object.entries(groupedPermissions).map(([group, perms]) => (
                        <Collapsible 
                          key={group}
                          open={expandedGroups.includes(group)}
                          onOpenChange={() => toggleGroup(group)}
                          defaultOpen
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="font-medium">{group}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {perms.filter(p => p.is_enabled).length} de {perms.length} ativas
                                </Badge>
                                <ChevronRight className={`h-4 w-4 transition-transform ${expandedGroups.includes(group) ? 'rotate-90' : ''}`} />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid grid-cols-2 gap-2 mt-2 pl-2">
                              {perms.map(perm => {
                                const isBlocked = selectedRole.key === 'super_admin' || 
                                  (perm.permission_key === 'can_make_orders' && ADMIN_ROLE_KEYS.includes(selectedRole.key));
                                const isCritical = perm.permission_key === 'can_make_orders';
                                
                                return (
                                  <div 
                                    key={perm.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      isBlocked ? 'bg-gray-50 border-gray-200' : 
                                      isCritical ? 'bg-amber-50 border-amber-200' : 
                                      'bg-white border-gray-100'
                                    }`}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm truncate">{perm.permission_label}</span>
                                        {isCritical && (
                                          <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 shrink-0">
                                            CRÍTICA
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    {isBlocked ? (
                                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                                        {selectedRole.key === 'super_admin' ? 'Sempre ativo' : 'Bloqueado'}
                                      </Badge>
                                    ) : (
                                      <Switch
                                        checked={perm.is_enabled}
                                        onCheckedChange={(checked) => 
                                          togglePermission.mutate({ 
                                            permissionId: perm.id, 
                                            isEnabled: checked,
                                            permissionKey: perm.permission_key
                                          })
                                        }
                                        disabled={togglePermission.isPending}
                                        className="shrink-0 ml-2"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Conta</DialogTitle>
            <DialogDescription>
              Crie um novo tipo de conta com permissões personalizadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Tipo</label>
              <Input
                value={newRole.display_name}
                onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value, key: e.target.value })}
                placeholder="Ex: Gestor de Vendas"
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Descreva as responsabilidades..."
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Ícone</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {iconOptions.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewRole({ ...newRole, icon: key })}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      newRole.icon === key 
                        ? 'border-[hsl(var(--exa-red))] bg-[hsl(var(--exa-red))]/10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={label}
                  >
                    <Icon className="h-5 w-5" style={{ color: newRole.icon === key ? newRole.color : undefined }} />
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Cor do Tema</label>
              <div className="flex gap-2 mt-2">
                {['#9C1E1E', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewRole({ ...newRole, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newRole.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createRole.mutate()}
              disabled={!newRole.display_name || createRole.isPending}
              className="bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90"
            >
              {createRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Tipo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tipo "{deleteConfirm?.display_name}" e todas suas permissões serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteRole.mutate(deleteConfirm.key)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Module Permissions Modal */}
      {modulePermissionsRole && (
        <ModulePermissionsModal
          role={modulePermissionsRole}
          onClose={() => setModulePermissionsRole(null)}
        />
      )}
    </div>
  );
}
