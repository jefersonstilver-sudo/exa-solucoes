import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Search, Loader2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  nome: string | null;
  email: string | null;
}

const AdminMasterVideoConsole: React.FC = () => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadAdmins = async () => {
    const { data } = await supabase
      .from('user_roles' as any)
      .select('user_id')
      .eq('role', 'admin_master_video');
    setAdmins(new Set(((data as any) || []).map((r: any) => r.user_id)));
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const term = search.trim();
      let q = supabase.from('users').select('id, nome, email').limit(30);
      if (term) {
        q = q.or(`email.ilike.%${term}%,nome.ilike.%${term}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      setUsers((data as UserRow[]) || []);
    } catch (e: any) {
      toast.error(e?.message || 'Falha na busca.');
    } finally { setLoading(false); }
  };

  const grant = async (u: UserRow) => {
    setActingId(u.id);
    try {
      const { error } = await supabase.from('user_roles' as any).insert({
        user_id: u.id,
        role: 'admin_master_video',
      });
      if (error) throw error;
      // Notificação por email (não bloqueia o sucesso)
      try {
        await supabase.functions.invoke('send-admin-master-video-notice', {
          body: { email: u.email, name: u.nome },
        });
      } catch (mailErr) {
        console.warn('Falha ao enviar email de aviso:', mailErr);
      }
      toast.success(`${u.email} é agora Admin Master de Vídeo. Email de aviso enviado.`);
      await loadAdmins();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao conceder.');
    } finally { setActingId(null); }
  };

  const revoke = async (u: UserRow) => {
    setActingId(u.id);
    try {
      const { error } = await supabase
        .from('user_roles' as any)
        .delete()
        .eq('user_id', u.id)
        .eq('role', 'admin_master_video');
      if (error) throw error;
      toast.success(`Função removida de ${u.email}.`);
      await loadAdmins();
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao remover.');
    } finally { setActingId(null); }
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#C7141A] to-[#7D1818] flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Admin Master de Vídeo</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários com permissão de impersonar clientes e operar vídeos no portal anunciante.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por email ou nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="ml-1">Buscar</span>
          </Button>
        </div>
      </Card>

      <Card className="p-2 divide-y">
        {users.length === 0 && !loading && (
          <div className="p-6 text-sm text-muted-foreground text-center">
            Faça uma busca para começar.
          </div>
        )}
        {users.map((u) => {
          const isAdmin = admins.has(u.id);
          return (
            <div key={u.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{u.nome || u.email}</span>
                  {isAdmin && (
                    <Badge className="bg-[#C7141A]/10 text-[#C7141A] border-[#C7141A]/30">
                      Admin Master
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
              </div>
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revoke(u)}
                  disabled={actingId === u.id}
                >
                  {actingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                  <span className="ml-1">Remover</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-[#C7141A] hover:bg-[#B40D1A] text-white"
                  onClick={() => grant(u)}
                  disabled={actingId === u.id}
                >
                  {actingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  <span className="ml-1">Conceder</span>
                </Button>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
};

export default AdminMasterVideoConsole;
