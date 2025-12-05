import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ModernSuperAdminLayout from '@/components/admin/layout/ModernSuperAdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Settings, Megaphone, Wallet, Briefcase, User, Monitor,
  Plus, Pencil, Trash2, ChevronRight, Check, X, Loader2, ArrowLeft
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

export default function TiposContaPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<RoleType | null>(null);
  const [newRole, setNewRole] = useState({
    key: '',
    display_name: '',
    description: '',
    color: '#6B7280',
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

  // Toggle permission mutation
  const togglePermission = useMutation({
    mutationFn: async ({ permissionId, isEnabled }: { permissionId: string; isEnabled: boolean }) => {
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
    onError: () => {
      toast.error('Erro ao atualizar permissão');
    }
  });

  // Create role mutation
  const createRole = useMutation({
    mutationFn: async () => {
      // Create role type
      const { data: roleData, error: roleError } = await supabase
        .from('role_types')
        .insert({
          key: newRole.key.toLowerCase().replace(/\s+/g, '_'),
          display_name: newRole.display_name,
          description: newRole.description,
          color: newRole.color,
          is_system: false,
          is_active: true,
        })
        .select()
        .single();
      
      if (roleError) throw roleError;

      // Copy permissions from super_admin as template (all disabled)
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
      setNewRole({ key: '', display_name: '', description: '', color: '#6B7280' });
      toast.success('Tipo de conta criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar tipo de conta');
    }
  });

  // Delete role mutation
  const deleteRole = useMutation({
    mutationFn: async (roleKey: string) => {
      const { error } = await supabase
        .from('role_types')
        .delete()
        .eq('key', roleKey);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-types'] });
      setDeleteConfirm(null);
      toast.success('Tipo de conta removido');
    },
    onError: () => {
      toast.error('Erro ao remover tipo de conta');
    }
  });

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.permission_group]) {
      acc[perm.permission_group] = [];
    }
    acc[perm.permission_group].push(perm);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  const permissionGroups = Object.keys(groupedPermissions);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || User;
    return IconComponent;
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <ModernSuperAdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 safe-area-top">
              <div className="flex items-center gap-3">
                {isEditingPermissions ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditingPermissions(false);
                      setSelectedRole(null);
                    }}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/super_admin/usuarios')}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-lg font-semibold">
                    {isEditingPermissions ? selectedRole?.display_name : 'Tipos de Conta'}
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    {isEditingPermissions ? 'Editar permissões' : `${roleTypes.length} tipos configurados`}
                  </p>
                </div>
              </div>
              {!isEditingPermissions && (
                <Button
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="h-8 bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <AnimatePresence mode="wait">
              {isEditingPermissions && selectedRole ? (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {loadingPermissions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    permissionGroups.map((group) => (
                      <div key={group} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">{group}</h3>
                        <div className="space-y-2">
                          {groupedPermissions[group].map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                            >
                              <span className="text-sm text-gray-700">{perm.permission_label}</span>
                              <Switch
                                checked={perm.is_enabled}
                                onCheckedChange={(checked) => 
                                  togglePermission.mutate({ permissionId: perm.id, isEnabled: checked })
                                }
                                disabled={selectedRole.is_system && selectedRole.key === 'super_admin'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="roles"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {loadingRoles ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    roleTypes.map((role) => {
                      const IconComponent = getIcon(role.icon);
                      return (
                        <motion.div
                          key={role.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="p-2 rounded-xl"
                              style={{ backgroundColor: `${role.color}15` }}
                            >
                              <IconComponent
                                className="h-5 w-5"
                                style={{ color: role.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">{role.display_name}</h3>
                                {role.is_system && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                    Sistema
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {role.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => {
                                setSelectedRole(role);
                                setIsEditingPermissions(true);
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {!role.is_system && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setIsEditingPermissions(true);
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Permissões
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs text-red-600 hover:text-red-700"
                                onClick={() => setDeleteConfirm(role)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="max-w-[95vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Tipo de Conta</DialogTitle>
              <DialogDescription>
                Crie um novo tipo de conta com permissões personalizadas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({ 
                    ...newRole, 
                    display_name: e.target.value,
                    key: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  })}
                  placeholder="Ex: Gerente Regional"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Descreva as responsabilidades deste tipo de conta"
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-2 mt-2">
                  {['#9C1E1E', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6B7280'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewRole({ ...newRole, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newRole.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createRole.mutate()}
                disabled={!newRole.display_name || createRole.isPending}
                className="bg-[#9C1E1E] hover:bg-[#7A1818]"
              >
                {createRole.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Criar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover tipo de conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Usuários com este tipo de conta perderão seus acessos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && deleteRole.mutate(deleteConfirm.key)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ModernSuperAdminLayout>
    );
  }

  // Desktop Layout
  return (
    <ModernSuperAdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/super_admin/usuarios')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Tipos de Conta</h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie tipos de conta e suas permissões
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-[#9C1E1E] hover:bg-[#7A1818]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Types List */}
            <div className="lg:col-span-1 space-y-3">
              {loadingRoles ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                roleTypes.map((role) => {
                  const IconComponent = getIcon(role.icon);
                  const isSelected = selectedRole?.id === role.id;
                  
                  return (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedRole(role)}
                      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-[#9C1E1E]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: `${role.color}15` }}
                        >
                          <IconComponent
                            className="h-5 w-5"
                            style={{ color: role.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{role.display_name}</h3>
                            {role.is_system && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                Sistema
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {role.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[#9C1E1E]" />
                        )}
                      </div>
                      
                      {!role.is_system && isSelected && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(role);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Permissions Editor */}
            <div className="lg:col-span-2">
              {selectedRole ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${selectedRole.color}15` }}
                    >
                      {(() => {
                        const IconComponent = getIcon(selectedRole.icon);
                        return <IconComponent className="h-6 w-6" style={{ color: selectedRole.color }} />;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{selectedRole.display_name}</h2>
                      <p className="text-sm text-muted-foreground">Permissões de acesso</p>
                    </div>
                  </div>

                  {loadingPermissions ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissionGroups.map((group) => (
                        <div key={group} className="border border-gray-200 rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">{group}</h3>
                          <div className="space-y-2">
                            {groupedPermissions[group].map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between py-1.5"
                              >
                                <span className="text-sm text-gray-700">{perm.permission_label}</span>
                                <Switch
                                  checked={perm.is_enabled}
                                  onCheckedChange={(checked) => 
                                    togglePermission.mutate({ permissionId: perm.id, isEnabled: checked })
                                  }
                                  disabled={selectedRole.is_system && selectedRole.key === 'super_admin'}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedRole.key === 'super_admin' && (
                    <p className="text-xs text-amber-600 mt-4 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Super Admin tem acesso total e não pode ser modificado.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-md flex flex-col items-center justify-center text-center">
                  <Shield className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Selecione um tipo de conta</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em um tipo de conta para editar suas permissões
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Tipo de Conta</DialogTitle>
            <DialogDescription>
              Crie um novo tipo de conta com permissões personalizadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={newRole.display_name}
                onChange={(e) => setNewRole({ 
                  ...newRole, 
                  display_name: e.target.value,
                  key: e.target.value.toLowerCase().replace(/\s+/g, '_')
                })}
                placeholder="Ex: Gerente Regional"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Descreva as responsabilidades deste tipo de conta"
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <div className="flex gap-2 mt-2">
                {['#9C1E1E', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#6B7280'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewRole({ ...newRole, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newRole.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createRole.mutate()}
              disabled={!newRole.display_name || createRole.isPending}
              className="bg-[#9C1E1E] hover:bg-[#7A1818]"
            >
              {createRole.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tipo de conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Usuários com este tipo de conta perderão seus acessos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteRole.mutate(deleteConfirm.key)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModernSuperAdminLayout>
  );
}
