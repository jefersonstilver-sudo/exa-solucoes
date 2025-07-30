import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Tag } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (oldName: string | null, newName: string) => Promise<boolean>;
  editingCategory: string | null;
  existingCategories: string[];
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
  existingCategories
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory);
    } else {
      setCategoryName('');
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;

    // Verificar se já existe (apenas para novas categorias ou renomeação)
    if (trimmedName !== editingCategory && existingCategories.includes(trimmedName)) {
      alert('Esta categoria já existe!');
      return;
    }

    setIsSubmitting(true);
    
    const success = await onSubmit(editingCategory, trimmedName);
    
    if (success) {
      onClose();
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nome da Categoria *</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Institucional, Comercial, Documentário..."
              maxLength={50}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {categoryName.length}/50 caracteres
            </p>
          </div>

          {editingCategory && (
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Atenção:</strong> Alterar o nome da categoria irá atualizá-la em todos os vídeos associados.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !categoryName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {editingCategory ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                editingCategory ? 'Atualizar Categoria' : 'Criar Categoria'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;