/**
 * RoleUsersPanel - Lista todos os usuários vinculados a um tipo de conta (role).
 * Permite buscar, abrir o console enterprise para editar/bloquear/excluir, e
 * adicionar novos usuários já com o tipo pré-selecionado.
 *
 * Reutiliza o UserConsoleDialog existente (módulo completo de gestão de usuário).
 */
import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  UserPlus,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Ban,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserConsoleDialog } from '@/components/admin/users/console/UserConsoleDialog';
import type { ConsoleUser } from '@/types/userConsoleTypes';
import type { UserRole } from '@/types/userTypes';
import CreateUserDialog from '@/components/admin/users/CreateUserDialog';
import { toast } from 'sonner';

interface RoleLite {
  id: string;
  key: string;
  display_name: string;
  color: string;
}

interface RoleUsersPanelProps {
  role: RoleLite;
  currentUserId?: string | null;
}

interface RoleUserRow {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  departamento_id: string | null;
  data_criacao: string;
  is_blocked: boolean | null;
  whatsapp: string | null;
  whatsapp_verified: boolean | null;
  email_confirmed_at: string | null;
}

export const RoleUsersPanel: React.FC<RoleUsersPanelProps> = ({ role, currentUserId }) => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [consoleUser, setConsoleUser] = useState<ConsoleUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-by-role', role.key],
    queryFn: async () => {
      // Base user info from public.users
      const { data: baseUsers, error } = await (supabase as any)
        .from('users')
        .select('id, email, nome, role, departamento_id, data_criacao, is_blocked')
        .eq('role', role.key)
        .order('data_criacao', { ascending: false });
      if (error) throw error;
      const ids = (baseUsers || []).map((u: any) => u.id);
      if (ids.length === 0) return [] as RoleUserRow[];

      // Enrich with WhatsApp validation status from profiles (best-effort)
      const { data: profiles } = await (supabase as any)
        .from('profiles')
        .select('id, whatsapp, whatsapp_verified')
        .in('id', ids);
      const profileMap = new Map<string, any>(
        (profiles || []).map((p: any) => [p.id, p])
      );

      return (baseUsers || []).map((u: any) => {
        const p = profileMap.get(u.id) || {};
        return {
          id: u.id,
          email: u.email,
          nome: u.nome ?? null,
          role: u.role,
          departamento_id: u.departamento_id ?? null,
          data_criacao: u.data_criacao,
          is_blocked: u.is_blocked ?? false,
          whatsapp: p.whatsapp ?? null,
          whatsapp_verified: p.whatsapp_verified ?? null,
          email_confirmed_at: p.email_confirmed_at ?? null,
        } as RoleUserRow;
      });
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-light'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('departamentos')
        .select('id, nome');
      if (error) return [];
      return data as Array<{ id: string; nome: string }>;
    },
  });

  const deptMap = useMemo(() => {
    const m = new Map<string, string>();
    (departments || []).forEach((d) => m.set(d.id, d.nome));
    return m;
  }, [departments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users || [];
    return (users || []).filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        (u.nome || '').toLowerCase().includes(term)
    );
  }, [users, search]);

  const openConsole = (u: RoleUserRow) => {
    const consoleU: ConsoleUser = {
      id: u.id,
      email: u.email,
      nome: u.nome ?? undefined,
      role: u.role as UserRole,
      departamento_id: u.departamento_id ?? undefined,
      data_criacao: u.data_criacao,
      email_confirmed_at: u.email_confirmed_at ?? undefined,
      is_blocked: u.is_blocked ?? false,
    };
    setConsoleUser(consoleU);
  };

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['users-by-role'] });
    qc.invalidateQueries({ queryKey: ['user-counts-by-role'] });
    qc.invalidateQueries({ queryKey: ['users'] });
  };

  const resendWhatsApp = async (u: RoleUserRow) => {
    if (!u.whatsapp) {
      toast.error('Este usuário não tem WhatsApp cadastrado.');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('send-user-whatsapp-code', {
        body: { user_id: u.id, whatsapp: u.whatsapp },
      });
      if (error) throw error;
      toast.success('Código de validação enviado por WhatsApp.');
    } catch (e: any) {
      toast.error('Falha ao enviar código', { description: e?.message });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b bg-white/60 backdrop-blur-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9 h-9"
          />
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-[hsl(var(--exa-red))] hover:bg-[hsl(var(--exa-red))]/90 h-9"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          Adicionar
        </Button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 bg-gray-100 rounded-full mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-sm">
                {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário com este tipo'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
                {search
                  ? 'Tente outro termo de busca.'
                  : `Crie o primeiro usuário com o tipo "${role.display_name}".`}
              </p>
              {!search && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreate(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Adicionar usuário
                </Button>
              )}
            </div>
          ) : (
            filtered.map((u) => {
              const isMe = currentUserId === u.id;
              const dept = u.departamento_id ? deptMap.get(u.departamento_id) : null;
              const initials = (u.nome || u.email)
                .split(' ')
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase();
              return (
                <div
                  key={u.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                    style={{ backgroundColor: role.color }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {u.nome || u.email}
                      </span>
                      {isMe && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1">
                          Você
                        </Badge>
                      )}
                      {u.is_blocked && (
                        <Badge variant="destructive" className="text-[9px] h-4 px-1">
                          <Ban className="h-2.5 w-2.5 mr-0.5" />
                          Bloqueado
                        </Badge>
                      )}
                      {u.whatsapp_verified ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1 border-emerald-300 text-emerald-700"
                        >
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                          WhatsApp ok
                        </Badge>
                      ) : u.whatsapp ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] h-4 px-1 border-amber-300 text-amber-700"
                        >
                          <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
                          WhatsApp pendente
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="truncate">{u.email}</span>
                      {dept && <span>• {dept}</span>}
                      <span>
                        • Desde{' '}
                        {format(new Date(u.data_criacao), "dd 'de' MMM yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openConsole(u)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Abrir console
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openConsole(u)}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Trocar tipo de conta
                      </DropdownMenuItem>
                      {u.whatsapp && !u.whatsapp_verified && (
                        <DropdownMenuItem onClick={() => resendWhatsApp(u)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Reenviar validação WhatsApp
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openConsole(u)}
                        className={u.is_blocked ? 'text-emerald-600' : 'text-amber-600'}
                      >
                        {u.is_blocked ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Desbloquear
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquear
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openConsole(u)}
                        disabled={isMe}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Excluir usuário…
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* User Console Dialog */}
      <UserConsoleDialog
        open={!!consoleUser}
        onOpenChange={(open) => !open && setConsoleUser(null)}
        user={consoleUser}
        onUserUpdated={() => {
          refreshAll();
        }}
      />

      {/* Create User Dialog (with role pre-selected) */}
      <CreateUserDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultRole={role.key}
        onSuccess={() => {
          setShowCreate(false);
          refreshAll();
        }}
      />
    </div>
  );
};

export default RoleUsersPanel;
