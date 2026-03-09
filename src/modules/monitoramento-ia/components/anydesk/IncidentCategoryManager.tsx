import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIncidentCategories, IncidentCategory } from "../../hooks/useDeviceIncidents";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface IncidentCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentCategoryManager = ({ isOpen, onClose }: IncidentCategoryManagerProps) => {
  const { categories, createCategory, updateCategory, deleteCategory } = useIncidentCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', label: '', icon: '❓', color: '#6B7280' });

  const resetForm = () => {
    setForm({ name: '', label: '', icon: '❓', color: '#6B7280' });
    setEditingId(null);
    setIsCreating(false);
  };

  const startEdit = (cat: IncidentCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, label: cat.label, icon: cat.icon, color: cat.color });
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return;
    if (isCreating) {
      const slug = form.name.trim() || form.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      await createCategory({ ...form, name: slug });
    } else if (editingId) {
      await updateCategory(editingId, { label: form.label, icon: form.icon, color: form.color });
    }
    resetForm();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === id);
    if (direction === 'up' && idx > 0) {
      await updateCategory(categories[idx].id, { sort_order: categories[idx - 1].sort_order });
      await updateCategory(categories[idx - 1].id, { sort_order: categories[idx].sort_order });
    } else if (direction === 'down' && idx < categories.length - 1) {
      await updateCategory(categories[idx].id, { sort_order: categories[idx + 1].sort_order });
      await updateCategory(categories[idx + 1].id, { sort_order: categories[idx].sort_order });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ Gerenciar Categorias de Incidentes
          </DialogTitle>
          <DialogDescription>
            Crie, edite ou exclua categorias para classificar incidentes offline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border bg-card">
              {editingId === cat.id ? (
                /* Edit mode */
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      className="w-14 text-center"
                      maxLength={4}
                    />
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="flex-1"
                      placeholder="Nome da categoria"
                    />
                    <Input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={resetForm}>
                      <X className="h-3 w-3 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="h-3 w-3 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <Badge
                    className="text-sm px-2 py-1"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                      borderColor: `${cat.color}40`,
                    }}
                  >
                    {cat.icon} {cat.label}
                  </Badge>
                  {cat.is_default && (
                    <Shield className="h-3 w-3 text-muted-foreground" />
                  )}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleReorder(cat.id, 'up')}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleReorder(cat.id, 'down')}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(cat)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {!cat.is_default && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A categoria "{cat.label}" será removida. Incidentes existentes perderão a referência.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCategory(cat.id)} className="bg-red-600 hover:bg-red-700">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Criar nova */}
        {isCreating ? (
          <div className="space-y-2 border rounded-lg p-3 bg-card">
            <p className="text-sm font-semibold">Nova Categoria</p>
            <div className="flex gap-2">
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-14 text-center"
                placeholder="🔥"
                maxLength={4}
              />
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="flex-1"
                placeholder="Nome da categoria"
              />
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-12 h-10 p-1 cursor-pointer"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={resetForm}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.label.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-3 w-3 mr-1" /> Criar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { resetForm(); setIsCreating(true); }}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Categoria
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
