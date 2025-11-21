import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'link' | 'document';
  metadata?: any;
}

interface KnowledgeSectionProps {
  agentKey: string;
  section: string;
  items: KnowledgeItem[];
  onRefresh: () => void;
}

export const KnowledgeSection = ({ agentKey, section, items, onRefresh }: KnowledgeSectionProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: '', content: '', type: 'text' as const });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newItem.title || !newItem.content) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('agent_knowledge')
        .insert({
          agent_key: agentKey,
          section,
          title: newItem.title,
          content: newItem.content,
          metadata: { type: newItem.type },
          is_active: true
        });

      if (error) throw error;

      toast.success('Item adicionado com sucesso');
      setNewItem({ title: '', content: '', type: 'text' });
      setIsAddDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item removido');
      onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao remover item');
    }
  };

  const handleUpdate = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Item atualizado');
      setEditingId(null);
      onRefresh();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Itens de Conhecimento</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Item de Conhecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                >
                  <option value="text">Texto</option>
                  <option value="document">Documento</option>
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div>
                <Label>Título</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Política de Preços"
                />
              </div>
              <div>
                <Label>Conteúdo</Label>
                <Textarea
                  value={newItem.content}
                  onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                  placeholder="Digite o conteúdo completo..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const textarea = document.getElementById(`content-${item.id}`) as HTMLTextAreaElement;
                          if (textarea) handleUpdate(item.id, textarea.value);
                        }}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(item.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === item.id ? (
                <Textarea
                  id={`content-${item.id}`}
                  defaultValue={item.content}
                  className="min-h-[150px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum item adicionado ainda. Clique em "Adicionar Item" para começar.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
