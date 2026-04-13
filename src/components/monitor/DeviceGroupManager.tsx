import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { DeviceGroup } from '@/hooks/useDeviceGroups';

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F43F5E',
];

interface DeviceGroupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: DeviceGroup[];
  onCreateGroup: (nome: string, cor: string) => Promise<any>;
  onUpdateGroup: (id: string, updates: { nome?: string; cor?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export const DeviceGroupManager: React.FC<DeviceGroupManagerProps> = ({
  open,
  onOpenChange,
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#6B7280');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCor, setEditCor] = useState('');

  const handleCreate = async () => {
    if (!nome.trim()) return;
    await onCreateGroup(nome.trim(), cor);
    setNome('');
    setCor('#6B7280');
  };

  const handleStartEdit = (group: DeviceGroup) => {
    setEditingId(group.id);
    setEditNome(group.nome);
    setEditCor(group.cor);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editNome.trim()) return;
    await onUpdateGroup(editingId, { nome: editNome.trim(), cor: editCor });
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Grupos de Painéis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Create new group */}
          <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
            <Label className="text-xs font-semibold">Novo Grupo</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do grupo (ex: Internos)"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      cor === c ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={handleCreate} disabled={!nome.trim()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Criar
              </Button>
            </div>
          </div>

          {/* Groups list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum grupo criado</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-2 p-2.5 border border-border rounded-lg"
                  style={{ borderLeftColor: group.cor, borderLeftWidth: '4px' }}
                >
                  {editingId === group.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                editCor === c ? 'border-foreground scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditCor(c)}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                          <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.cor }}
                      />
                      <span className="flex-1 text-sm font-medium truncate">{group.nome}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(group)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteGroup(group.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
