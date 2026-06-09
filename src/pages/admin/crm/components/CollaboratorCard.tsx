import React, { useState } from 'react';
import { Pencil, Loader2, MoreVertical, RefreshCw, LogOut, Trash2, QrCode, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEvolutionInstanceActions } from '../lib/useEvolutionInstanceActions';
import { InstanceQRDialog } from './InstanceQRDialog';

export interface CollaboratorRow {
  id: string;
  collaborator_name: string;
  collaborator_phone: string | null;
  profile_picture_url: string | null;
  profile_name: string | null;
  status: string;
  instance_name?: string;
  is_notifications?: boolean;
}

interface Props {
  collaborator: CollaboratorRow;
  onUpdated: () => void;
  selected?: boolean;
  onSelect?: () => void;
}

const statusColor: Record<string, string> = {
  connected: 'bg-emerald-500',
  pending: 'bg-amber-500',
  disconnected: 'bg-gray-400',
};

export const CollaboratorCard: React.FC<Props> = ({
  collaborator,
  onUpdated,
  selected,
  onSelect,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [purgeHistory, setPurgeHistory] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [name, setName] = useState(collaborator.collaborator_name);
  const [phone, setPhone] = useState(collaborator.collaborator_phone ?? '');
  const [saving, setSaving] = useState(false);
  const { logout, deleteInstance, busy } = useEvolutionInstanceActions();

  const initials = collaborator.collaborator_name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isNotif = !!collaborator.is_notifications;
  const requireTypedConfirm = isNotif
    ? confirmText.trim().toUpperCase() === 'APAGAR'
    : true;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome obrigatório');
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any)
      .from('evolution_instances')
      .update({
        collaborator_name: name.trim(),
        collaborator_phone: phone.trim() || null,
      })
      .eq('id', collaborator.id);
    setSaving(false);
    if (error) {
      toast.error('Falha ao salvar');
      return;
    }
    toast.success('Colaborador atualizado');
    setEditOpen(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (!collaborator.instance_name) {
      toast.error('Instância sem nome — apague manualmente');
      return;
    }
    try {
      await deleteInstance(collaborator.instance_name, collaborator.id, {
        purgeLocalHistory: purgeHistory,
      });
      setDeleteOpen(false);
      setConfirmText('');
      setPurgeHistory(false);
      onUpdated();
    } catch {
      /* toast já dado no hook */
    }
  };

  const handleLogout = async () => {
    if (!collaborator.instance_name) return;
    try {
      await logout(collaborator.instance_name, collaborator.id);
      onUpdated();
    } catch {
      /* */
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.();
          }
        }}
        className={cn(
          'group relative flex-shrink-0 w-36 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9C1E1E]',
          selected
            ? 'border-[#9C1E1E] ring-2 ring-[#9C1E1E]/30'
            : 'border-gray-200 hover:border-gray-300',
        )}
      >
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          {collaborator.profile_picture_url ? (
            <img
              src={collaborator.profile_picture_url}
              alt={collaborator.collaborator_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-3xl font-semibold text-gray-400">{initials}</span>
          )}
          <span
            className={cn(
              'absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white',
              statusColor[collaborator.status] ?? 'bg-gray-400',
            )}
            title={collaborator.status}
          />
          {isNotif && (
            <span
              className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#7D1818]/90 text-white text-[10px] font-semibold shadow-sm"
              title="Instância de notificações automáticas"
            >
              <Bell className="w-2.5 h-2.5" /> Notif.
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
            aria-label="Editar colaborador"
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/95 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <div
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Ações da instância"
                  className="w-7 h-7 rounded-full bg-white/95 shadow-sm flex items-center justify-center hover:bg-white"
                >
                  <MoreVertical className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => setQrOpen(true)}
                  disabled={!collaborator.instance_name}
                >
                  <QrCode className="w-3.5 h-3.5 mr-2" />
                  Reconectar (QR)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={busy || !collaborator.instance_name}
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Desconectar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Apagar instância
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {collaborator.collaborator_name}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {collaborator.collaborator_phone || collaborator.profile_name || '—'}
          </p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>
              Altere o nome ou o telefone exibidos no CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Apagar instância
            </DialogTitle>
            <DialogDescription>
              Esta ação remove a instância <strong>{collaborator.collaborator_name}</strong>{' '}
              do servidor Evolution e do banco. Não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {isNotif && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900">
              <strong>⚠️ Atenção:</strong> esta é a instância dedicada de{' '}
              <strong>notificações automáticas</strong> do sistema (painéis offline, 2FA,
              agendamentos, propostas, etc.). Apagá-la interrompe todos esses alertas
              até que seja recriada e reconectada via XAlerts.
              <div className="mt-2">
                Para confirmar, digite <code className="font-mono font-semibold">APAGAR</code>:
                <Input
                  className="mt-2"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="APAGAR"
                />
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <Checkbox
              id="purge-history"
              checked={purgeHistory}
              onCheckedChange={(v) => setPurgeHistory(!!v)}
            />
            <div className="flex-1">
              <Label htmlFor="purge-history" className="text-sm font-medium cursor-pointer">
                Apagar também o histórico de conversas e mensagens
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Por padrão, mantemos o histórico salvo no banco para auditoria. Marque
                para remover tudo de forma irreversível.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={busy || !requireTypedConfirm}
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Apagar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {collaborator.instance_name && (
        <InstanceQRDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          instanceName={collaborator.instance_name}
          rowId={collaborator.id}
          title={`Reconectar ${collaborator.collaborator_name}`}
          onConnected={onUpdated}
        />
      )}
    </>
  );
};

export default CollaboratorCard;
