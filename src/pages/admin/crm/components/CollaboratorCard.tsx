import React, { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CollaboratorRow {
  id: string;
  collaborator_name: string;
  collaborator_phone: string | null;
  profile_picture_url: string | null;
  profile_name: string | null;
  status: string;
}

interface Props {
  collaborator: CollaboratorRow;
  onUpdated: () => void;
}

const statusColor: Record<string, string> = {
  connected: 'bg-emerald-500',
  pending: 'bg-amber-500',
  disconnected: 'bg-gray-400',
};

export const CollaboratorCard: React.FC<Props> = ({ collaborator, onUpdated }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(collaborator.collaborator_name);
  const [phone, setPhone] = useState(collaborator.collaborator_phone ?? '');
  const [saving, setSaving] = useState(false);

  const initials = collaborator.collaborator_name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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

  return (
    <>
      <div className="group relative flex-shrink-0 w-36 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
        <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
          {collaborator.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
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
            className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              statusColor[collaborator.status] ?? 'bg-gray-400'
            }`}
            title={collaborator.status}
          />
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-gray-900 text-xs font-medium shadow">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </span>
          </button>
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
    </>
  );
};

export default CollaboratorCard;
