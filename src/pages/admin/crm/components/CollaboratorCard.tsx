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
import { cn } from '@/lib/utils';

export interface CollaboratorRow {
  id: string;
  collaborator_name: string;
  collaborator_phone: string | null;
  profile_picture_url: string | null;
  profile_name: string | null;
  status: string;
  instance_name?: string;
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
