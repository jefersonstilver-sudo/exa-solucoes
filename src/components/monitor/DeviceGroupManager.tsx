import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus, Layers, X, Check, BellOff, Bell } from 'lucide-react';
import { DeviceGroup } from '@/hooks/useDeviceGroups';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F43F5E',
  '#F59E0B',
];

interface DeviceGroupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: DeviceGroup[];
  onCreateGroup: (nome: string, cor: string, silenciar_alertas?: boolean) => Promise<any>;
  onUpdateGroup: (id: string, updates: { nome?: string; cor?: string; silenciar_alertas?: boolean }) => Promise<void>;
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
  const [silenciar, setSilenciar] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCor, setEditCor] = useState('');
  const [editSilenciar, setEditSilenciar] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!nome.trim() || creating) return;
    setCreating(true);
    await onCreateGroup(nome.trim(), cor, silenciar);
    setNome('');
    setCor('#6B7280');
    setSilenciar(false);
    setCreating(false);
  };

  const handleStartEdit = (group: DeviceGroup) => {
    setEditingId(group.id);
    setEditNome(group.nome);
    setEditCor(group.cor);
    setEditSilenciar(group.silenciar_alertas || false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editNome.trim()) return;
    await onUpdateGroup(editingId, { nome: editNome.trim(), cor: editCor, silenciar_alertas: editSilenciar });
    setEditingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] !bg-white/95 dark:!bg-[#0A0A0A]/95 backdrop-blur-2xl !border-white/20 dark:!border-white/10 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.4)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#6B1010] flex items-center justify-center shadow-lg">
              <Layers className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold">Grupos de Painéis</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">Organize seus painéis em categorias</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Create new group */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/80 to-muted/40 backdrop-blur-xl" />
            <div className="relative p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Novo Grupo</p>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do grupo (ex: Internos)"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="bg-background/80 backdrop-blur-sm border-border/50 focus:border-[#9C1E1E]/50 focus:ring-[#9C1E1E]/20 h-11 rounded-xl"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        'w-8 h-8 rounded-full transition-all duration-200 ease-out',
                        cor === c
                          ? 'ring-2 ring-offset-2 ring-offset-background scale-110 shadow-lg'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      )}
                      style={{
                        backgroundColor: c,
                        ...(cor === c ? { ringColor: c, boxShadow: `0 0 12px ${c}40` } : {}),
                      }}
                      onClick={() => setCor(c)}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!nome.trim() || creating}
                  className="bg-[#9C1E1E] hover:bg-[#B40D1A] text-white rounded-xl px-5 h-9 shadow-lg shadow-[#9C1E1E]/20 transition-all hover:shadow-[#9C1E1E]/40 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                <Label htmlFor="silenciar-novo" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  {silenciar ? <BellOff className="w-3.5 h-3.5 text-amber-500" /> : <Bell className="w-3.5 h-3.5 text-muted-foreground" />}
                  Silenciar alertas WhatsApp
                </Label>
                <Switch id="silenciar-novo" checked={silenciar} onCheckedChange={setSilenciar} />
              </div>
            </div>
          </div>

          {/* Groups list */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum grupo criado</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Crie seu primeiro grupo acima</p>
              </div>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={cn(
                    'group relative rounded-xl border transition-all duration-200',
                    editingId === group.id
                      ? 'bg-muted/60 border-border shadow-md'
                      : 'bg-background/60 backdrop-blur-sm border-border/50 hover:border-border hover:shadow-sm'
                  )}
                  style={{ borderLeftColor: group.cor, borderLeftWidth: '4px' }}
                >
                  {editingId === group.id ? (
                    <div className="p-3 space-y-3">
                      <Input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                        className="bg-background/80 border-border/50 h-10 rounded-xl"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5 flex-wrap">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={cn(
                                'w-6 h-6 rounded-full transition-all duration-200',
                                editCor === c
                                  ? 'ring-2 ring-offset-1 ring-offset-background scale-110'
                                  : 'opacity-60 hover:opacity-100 hover:scale-105'
                              )}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditCor(c)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-3 py-2">
                        <Label htmlFor={`silenciar-${group.id}`} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                          {editSilenciar ? <BellOff className="w-3.5 h-3.5 text-amber-500" /> : <Bell className="w-3.5 h-3.5 text-muted-foreground" />}
                          Silenciar alertas WhatsApp
                        </Label>
                        <Switch id={`silenciar-${group.id}`} checked={editSilenciar} onCheckedChange={setEditSilenciar} />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8 px-3 rounded-lg text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-8 px-3 rounded-lg text-xs bg-[#9C1E1E] hover:bg-[#B40D1A] text-white"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: group.cor, boxShadow: `0 0 8px ${group.cor}30` }}
                      />
                      <span className="flex-1 text-sm font-semibold text-foreground truncate flex items-center gap-2">
                        {group.nome}
                        {group.silenciar_alertas && (
                          <span title="Alertas WhatsApp silenciados" className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                            <BellOff className="w-3 h-3" />
                            Silenciado
                          </span>
                        )}
                      </span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-muted"
                          onClick={() => handleStartEdit(group)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                          onClick={() => onDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
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
