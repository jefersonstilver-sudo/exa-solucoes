import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserCog, Eye, AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Modal de boas-vindas exibido na primeira vez que um usuário com role
 * 'admin_master_video' faz login. Persistido em admin_master_video_onboarding.
 */
const AdminMasterWelcomeDialog: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      // Check role
      const { data: roleRow } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin_master_video')
        .maybeSingle();
      if (!roleRow) return;

      const { data: ob } = await supabase
        .from('admin_master_video_onboarding' as any)
        .select('seen_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled && !ob) setOpen(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleClose = async () => {
    setOpen(false);
    if (!user?.id) return;
    try {
      await supabase.from('admin_master_video_onboarding' as any).insert({
        user_id: user.id,
        seen_at: new Date().toISOString(),
      });
    } catch { /* noop */ }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl bg-gradient-to-br from-background to-muted/20 border-2 border-[#C7141A]/20">
        <DialogHeader>
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#C7141A] to-[#7D1818] flex items-center justify-center shadow-lg shadow-[#C7141A]/30">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            <Sparkles className="inline h-5 w-5 mr-1 text-[#C7141A]" />
            Bem-vindo, Admin Master de Vídeo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            Sua conta foi promovida ao nível <b>Admin Master de Vídeo</b>. Esta é uma função
            crítica de governança da operação de mídia.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 p-3 rounded-xl bg-muted/40">
              <UserCog className="h-5 w-5 text-[#C7141A] shrink-0 mt-0.5" />
              <div className="text-sm">
                <b>Acessar como cliente.</b> Em qualquer card de pedido ou vídeo de prédio,
                use o botão "Acessar como cliente" para entrar na área do anunciante e gerir
                pedidos, vídeos, relatórios e QR codes em seu nome.
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-xl bg-muted/40">
              <Eye className="h-5 w-5 text-[#C7141A] shrink-0 mt-0.5" />
              <div className="text-sm">
                <b>Sessão de 30 minutos.</b> Cada impersonação é registrada em auditoria
                (usuário, ações, horário) e expira automaticamente. Use o botão "Sair do
                modo cliente" no topo da tela quando terminar.
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <b>Cuidado.</b> Ações destrutivas (excluir vídeos, em massa ou individual)
                são permanentes — removem do banco, Storage e AWS. O cliente <i>não</i> é
                notificado, mas tudo fica registrado.
              </div>
            </div>
          </div>

          <Button onClick={handleClose} className="w-full bg-[#C7141A] hover:bg-[#B40D1A] text-white">
            Entendi, ativar acesso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMasterWelcomeDialog;
