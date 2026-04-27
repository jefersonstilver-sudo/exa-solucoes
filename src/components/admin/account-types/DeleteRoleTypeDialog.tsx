import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Loader2,
  Users,
  ShieldAlert,
  Info,
  Trash2,
  ArrowRight,
  UserX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleType {
  id: string;
  key: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
}

interface AffectedUser {
  id: string;
  email: string | null;
  nome: string | null;
  data_criacao: string | null;
}

interface DeleteRoleTypeDialogProps {
  role: RoleType | null;
  currentUserRoleKey: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export default function DeleteRoleTypeDialog({
  role,
  currentUserRoleKey,
  open,
  onOpenChange,
  onDeleted,
}: DeleteRoleTypeDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) setConfirmText('');
  }, [open]);

  const isSystemRole = !!role?.is_system;
  const isSelfRole = !!role && role.key === currentUserRoleKey;
  const isBlocked = isSystemRole || isSelfRole;

  const { data: affectedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['affected-users-by-role', role?.key],
    queryFn: async () => {
      if (!role) return [];
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, data_criacao')
        .eq('role', role.key as any)
        .order('data_criacao', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AffectedUser[];
    },
    enabled: !!role && open,
  });

  const hasUsers = affectedUsers.length > 0;
  const requiresTypedConfirm = hasUsers;
  const confirmOk = !requiresTypedConfirm || confirmText.trim().toUpperCase() === 'EXCLUIR';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!role) throw new Error('Tipo inválido');
      // Cascade delete: permissions first
      const { error: permErr } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_key', role.key);
      if (permErr) throw permErr;

      const { error: roleErr } = await supabase
        .from('role_types')
        .delete()
        .eq('key', role.key);
      if (roleErr) throw roleErr;

      return { affected: affectedUsers.length };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['role-types'] });
      queryClient.invalidateQueries({ queryKey: ['user-counts-by-role'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['module-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['module-permissions-modal'] });
      if (res.affected > 0) {
        toast.success(
          `Tipo "${role?.display_name}" excluído. ${res.affected} usuário(s) ficaram sem tipo válido — atribua um novo tipo a eles.`
        );
      } else {
        toast.success(`Tipo "${role?.display_name}" excluído com sucesso.`);
      }
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao excluir tipo de conta');
    },
  });

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  if (!role) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <AlertDialogHeader className="p-5 pb-3 border-b border-border bg-gradient-to-br from-red-50/80 to-white">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg text-red-900">
                Excluir tipo de conta "{role.display_name}"?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-red-700/80 mt-1">
                Esta ação é permanente e não pode ser desfeita.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isBlocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                {isSystemRole && (
                  <p>
                    <strong>Este tipo é do sistema</strong> e não pode ser excluído. Tipos
                    de sistema garantem o funcionamento do EXA (Super Admin, Admin,
                    Departamental, etc.).
                  </p>
                )}
                {!isSystemRole && isSelfRole && (
                  <p>
                    <strong>Você não pode excluir o tipo que está usando.</strong> Peça
                    a outro Super Admin para fazer essa operação.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Impact summary */}
          <div
            className={`rounded-xl border p-4 ${
              hasUsers
                ? 'bg-red-50/60 border-red-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  hasUsers ? 'bg-red-100' : 'bg-emerald-100'
                }`}
              >
                <Users
                  className={`h-4 w-4 ${
                    hasUsers ? 'text-red-600' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {loadingUsers
                    ? 'Calculando impacto…'
                    : hasUsers
                    ? `${affectedUsers.length} usuário(s) usam este tipo de conta`
                    : 'Nenhum usuário usa este tipo de conta'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasUsers
                    ? 'Eles perderão acesso ao sistema imediatamente após a exclusão.'
                    : 'Exclusão segura — sem impacto em usuários.'}
                </p>
              </div>
            </div>
          </div>

          {/* Affected users list */}
          {hasUsers && (
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">
                  Usuários impactados
                </span>
                <Badge variant="outline" className="text-[10px] h-5">
                  {affectedUsers.length}
                </Badge>
              </div>
              <ScrollArea className="max-h-56">
                <ul className="divide-y divide-border">
                  {affectedUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-md bg-red-100 flex-shrink-0">
                          <UserX className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.nome || u.email || 'Usuário sem nome'}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.email} • Cadastrado em {formatDate(u.data_criacao)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-[10px] flex-shrink-0">
                        Perderá acesso
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {/* Consequences */}
          {hasUsers && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-900 space-y-1">
                <p className="font-semibold">O que acontece após excluir:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-red-800">
                  <li>O tipo de conta e todas as suas permissões serão removidos.</li>
                  <li>
                    Os usuários listados ficarão <strong>sem tipo válido</strong> e
                    perderão acesso ao sistema no próximo login.
                  </li>
                  <li>
                    Será necessário <strong>atribuir manualmente um novo tipo</strong> a
                    cada usuário antes que voltem a acessar.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Suggested next steps */}
          {hasUsers && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 flex-1">
                <p className="font-semibold">Sugestão</p>
                <p className="text-xs text-blue-800 mt-0.5">
                  Para evitar bloqueio de acesso, primeiro atribua um novo tipo de conta
                  a cada usuário na página de Usuários e, em seguida, exclua este tipo.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-blue-700 hover:text-blue-900"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/super_admin/usuarios');
                  }}
                >
                  Ir para Usuários
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Typed confirmation */}
          {!isBlocked && requiresTypedConfirm && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">
                Para confirmar, digite{' '}
                <span className="font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  EXCLUIR
                </span>{' '}
                abaixo:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="font-mono"
                autoFocus
              />
            </div>
          )}
        </div>

        <AlertDialogFooter className="p-4 border-t border-border bg-muted/20 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={isBlocked || !confirmOk || deleteMutation.isPending || loadingUsers}
            className="gap-2"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {hasUsers ? 'Excluir mesmo assim' : 'Excluir tipo'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
