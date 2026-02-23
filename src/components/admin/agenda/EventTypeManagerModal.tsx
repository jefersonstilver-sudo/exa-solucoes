import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, X, Check, Loader2, AlertTriangle, GripVertical } from 'lucide-react';
import { useEventTypes, type EventType } from '@/hooks/agenda/useEventTypes';
import { cn } from '@/lib/utils';

const COLOR_OPTIONS = [
  { label: 'Verde', value: 'bg-emerald-100 text-emerald-700', preview: 'bg-emerald-500' },
  { label: 'Azul', value: 'bg-blue-100 text-blue-700', preview: 'bg-blue-500' },
  { label: 'Laranja', value: 'bg-orange-100 text-orange-700', preview: 'bg-orange-500' },
  { label: 'Roxo', value: 'bg-purple-100 text-purple-700', preview: 'bg-purple-500' },
  { label: 'Vermelho', value: 'bg-red-100 text-red-700', preview: 'bg-red-500' },
  { label: 'Vermelho EXA', value: 'bg-[#fde8e8] text-[#C7141A]', preview: 'bg-[#C7141A]' },
  { label: 'Rosa', value: 'bg-pink-100 text-pink-700', preview: 'bg-pink-500' },
  { label: 'Ciano', value: 'bg-cyan-100 text-cyan-700', preview: 'bg-cyan-500' },
  { label: 'Âmbar', value: 'bg-amber-100 text-amber-700', preview: 'bg-amber-500' },
  { label: 'Índigo', value: 'bg-indigo-100 text-indigo-700', preview: 'bg-indigo-500' },
  { label: 'Teal', value: 'bg-teal-100 text-teal-700', preview: 'bg-teal-500' },
];

const EMOJI_OPTIONS = [
  '✅', '📹', '📍', '📢', '📋', '🎯', '💡', '⭐', '🔔', '📞',
  '💼', '🏢', '🎉', '📝', '🔧', '🚀', '💰', '📊', '🤝', '⚡',
  '🎓', '🏥', '✈️', '🍽️', '🏃', '🎵', '📸', '🔑', '🛒', '❤️',
];

interface EventTypeManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventTypeManagerModal = ({ open, onOpenChange }: EventTypeManagerModalProps) => {
  const {
    eventTypes,
    isLoading,
    createEventType,
    updateEventType,
    deleteEventType,
    toggleEventType,
    isCreating,
    isUpdating,
    isDeleting,
  } = useEventTypes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState('');
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📋');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0].value);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const resetForm = () => {
    setFormLabel('');
    setFormName('');
    setFormIcon('📋');
    setFormColor(COLOR_OPTIONS[0].value);
    setShowEmojiPicker(false);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (et: EventType) => {
    setEditingId(et.id);
    setFormLabel(et.label);
    setFormIcon(et.icon);
    setFormColor(et.color);
    setIsAdding(false);
    setShowEmojiPicker(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleSaveNew = () => {
    if (!formLabel.trim()) return;
    const name = formLabel.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    
    createEventType(
      { name, label: formLabel.trim(), icon: formIcon, color: formColor },
      { onSuccess: () => resetForm() }
    );
  };

  const handleSaveEdit = () => {
    if (!editingId || !formLabel.trim()) return;
    updateEventType(
      { id: editingId, label: formLabel.trim(), icon: formIcon, color: formColor },
      { onSuccess: () => resetForm() }
    );
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteEventType(deleteConfirmId, {
      onSuccess: () => setDeleteConfirmId(null),
    });
  };

  const deleteTarget = eventTypes.find(et => et.id === deleteConfirmId);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <GripVertical className="h-4 w-4 text-blue-600" />
              </div>
              Gerenciar Tipos de Evento
            </DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova tipos de evento da sua agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Add button */}
            {!isAdding && !editingId && (
              <Button onClick={startAdd} variant="outline" className="w-full gap-2 border-dashed">
                <Plus className="h-4 w-4" /> Adicionar Novo Tipo
              </Button>
            )}

            {/* Add form */}
            {isAdding && (
              <div className="border rounded-lg p-4 space-y-3 bg-blue-50/30 border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-700">Novo Tipo de Evento</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nome visível</Label>
                  <Input
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Ex: Treinamento, Evento Social..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ícone</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="h-9 w-9 rounded-md border flex items-center justify-center text-lg hover:bg-muted transition-colors"
                    >
                      {formIcon}
                    </button>
                    <span className="text-xs text-muted-foreground">Clique para trocar</span>
                  </div>
                  {showEmojiPicker && (
                    <div className="grid grid-cols-10 gap-1 p-2 border rounded-md bg-background">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setFormIcon(emoji); setShowEmojiPicker(false); }}
                          className={cn(
                            "h-8 w-8 rounded flex items-center justify-center text-base hover:bg-muted transition-colors",
                            formIcon === emoji && "bg-primary/10 ring-1 ring-primary"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((co) => (
                      <button
                        key={co.value}
                        type="button"
                        onClick={() => setFormColor(co.value)}
                        className={cn(
                          "h-7 w-7 rounded-full transition-all",
                          co.preview,
                          formColor === co.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"
                        )}
                        title={co.label}
                      />
                    ))}
                  </div>
                </div>
                {/* Preview */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", formColor)}>
                    {formIcon} {formLabel || 'Novo Tipo'}
                  </span>
                </div>
                <Button onClick={handleSaveNew} disabled={!formLabel.trim() || isCreating} size="sm" className="w-full gap-1">
                  {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Criar Tipo
                </Button>
              </div>
            )}

            {/* Event types list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {eventTypes.map((et) => {
                  const isEditing = editingId === et.id;

                  if (isEditing) {
                    return (
                      <div key={et.id} className="border rounded-lg p-4 space-y-3 bg-amber-50/30 border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-amber-700">Editando: {et.label}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Nome visível</Label>
                          <Input
                            value={formLabel}
                            onChange={(e) => setFormLabel(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Ícone</Label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="h-9 w-9 rounded-md border flex items-center justify-center text-lg hover:bg-muted transition-colors"
                            >
                              {formIcon}
                            </button>
                            <span className="text-xs text-muted-foreground">Clique para trocar</span>
                          </div>
                          {showEmojiPicker && (
                            <div className="grid grid-cols-10 gap-1 p-2 border rounded-md bg-background">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => { setFormIcon(emoji); setShowEmojiPicker(false); }}
                                  className={cn(
                                    "h-8 w-8 rounded flex items-center justify-center text-base hover:bg-muted transition-colors",
                                    formIcon === emoji && "bg-primary/10 ring-1 ring-primary"
                                  )}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Cor</Label>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_OPTIONS.map((co) => (
                              <button
                                key={co.value}
                                type="button"
                                onClick={() => setFormColor(co.value)}
                                className={cn(
                                  "h-7 w-7 rounded-full transition-all",
                                  co.preview,
                                  formColor === co.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"
                                )}
                                title={co.label}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">Preview:</span>
                          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium", formColor)}>
                            {formIcon} {formLabel || et.label}
                          </span>
                        </div>
                        <Button onClick={handleSaveEdit} disabled={!formLabel.trim() || isUpdating} size="sm" className="w-full gap-1">
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Salvar Alterações
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={et.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        et.active ? "bg-background" : "bg-muted/50 opacity-60"
                      )}
                    >
                      {/* Icon + label */}
                      <span className={cn("inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium", et.color)}>
                        {et.icon} {et.label}
                      </span>

                      {et.is_default && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Padrão</Badge>
                      )}

                      <div className="flex-1" />

                      {/* Toggle active */}
                      <Switch
                        checked={et.active}
                        onCheckedChange={(checked) => toggleEventType({ id: et.id, active: checked })}
                        className="scale-75"
                      />

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => startEdit(et)}
                        disabled={!!editingId || isAdding}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete - only non-default */}
                      {!et.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteConfirmId(et.id)}
                          disabled={!!editingId || isAdding}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(v) => !v && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Tipo de Evento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo "{deleteTarget?.label}"? Tarefas existentes com este tipo não serão afetadas, mas ele não aparecerá mais para seleção.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventTypeManagerModal;
