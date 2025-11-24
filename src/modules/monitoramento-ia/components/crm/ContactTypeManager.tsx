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
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { useContactTypes } from '../../hooks/useContactTypes';

interface ContactTypeManagerProps {
  open: boolean;
  onClose: () => void;
}

export const ContactTypeManager: React.FC<ContactTypeManagerProps> = ({
  open,
  onClose
}) => {
  const { contactTypes, loading, createContactType, updateContactType, deleteContactType } = useContactTypes();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    color: '#6b7280',
    icon: 'user'
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.label) return;
    
    await createContactType(
      formData.name,
      formData.label,
      formData.color,
      formData.icon
    );
    
    setIsCreating(false);
    setFormData({ name: '', label: '', color: '#6b7280', icon: 'user' });
  };

  const handleUpdate = async (id: string) => {
    if (!formData.label) return;
    
    await updateContactType(id, formData.label, formData.color, formData.icon);
    setEditingId(null);
    setFormData({ name: '', label: '', color: '#6b7280', icon: 'user' });
  };

  const startEdit = (type: any) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      label: type.label,
      color: type.color,
      icon: type.icon
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Tipos de Contato</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova tipos de contato personalizados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Botão criar novo */}
          {!isCreating && !editingId && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Tipo de Contato
            </Button>
          )}

          {/* Formulário de criação */}
          {isCreating && (
            <div className="border border-dashed border-primary rounded-lg p-4 space-y-3">
              <div className="space-y-2">
                <Label>Nome (identificador único)</Label>
                <Input
                  placeholder="ex: fornecedor_especial"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Label (nome exibido)</Label>
                <Input
                  placeholder="ex: Fornecedor Especial"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor (hex)</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1">
                  Criar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ name: '', label: '', color: '#6b7280', icon: 'user' });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Lista de tipos existentes */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Carregando tipos...
              </p>
            ) : (
              contactTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-module-border glass-card"
                >
                  {editingId === type.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <Input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(type.id)}>
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setFormData({ name: '', label: '', color: '#6b7280', icon: 'user' });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.name}</p>
                        </div>
                        {type.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      {!type.is_default && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(type)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteContactType(type.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
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