import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Save, X, FileText, Link as LinkIcon, File } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import DocumentUpload from '@/components/ui/document-upload';

interface KnowledgeItem {
  id: string;
  agent_id: string;
  title: string;
  description?: string;
  content: string;
  content_type: 'text' | 'pdf' | 'link';
  keywords: string[];
  instruction?: string;
  active: boolean;
}

interface KnowledgeItemsProps {
  items: KnowledgeItem[];
  agentId: string;
}

export const KnowledgeItems = ({ items, agentId }: KnowledgeItemsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    content: '',
    content_type: 'text' as 'text' | 'pdf' | 'link',
    keywords: '',
    instruction: ''
  });

  const handleAdd = async () => {
    if (!newItem.title || !newItem.content) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('agent_knowledge_items')
        .insert({
          agent_id: agentId,
          title: newItem.title,
          description: newItem.description,
          content: newItem.content,
          content_type: newItem.content_type,
          keywords: newItem.keywords.split(',').map(k => k.trim()).filter(Boolean),
          instruction: newItem.instruction,
          active: true
        });

      if (error) throw error;

      toast.success('Item de conhecimento adicionado');
      setNewItem({
        title: '',
        description: '',
        content: '',
        content_type: 'text',
        keywords: '',
        instruction: ''
      });
      setIsAddDialogOpen(false);
      window.location.reload(); // Reload to get updated data
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      toast.error('Erro ao adicionar item');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setEditingItem({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('agent_knowledge_items')
        .update({
          title: editingItem.title,
          description: editingItem.description,
          content: editingItem.content,
          keywords: editingItem.keywords,
          instruction: editingItem.instruction
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success('Item atualizado');
      setEditingId(null);
      setEditingItem(null);
      window.location.reload();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Erro ao atualizar item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_knowledge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Item removido');
      window.location.reload(); // Reload to get updated data
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao remover item');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-module-primary">Conhecimento</h3>
          <p className="text-sm text-module-secondary">
            Adicione documentos, links e textos que o agente pode consultar
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-module-accent hover:bg-module-accent-hover">
              <Plus className="h-4 w-4" />
              Adicionar Conhecimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl w-[95vw] bg-module-card border-module text-module-primary max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-module-primary">Novo Item de Conhecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-module-primary">Tipo de Conteúdo</Label>
                <select
                  className="w-full mt-1 p-2 border rounded-md bg-module-input border-module text-module-primary"
                  value={newItem.content_type}
                  onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value as any })}
                >
                  <option value="text">Texto</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <Label className="text-module-primary">Título</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Media Kit Profissional"
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div>
                <Label className="text-module-primary">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={newItem.keywords}
                  onChange={(e) => setNewItem({ ...newItem, keywords: e.target.value })}
                  placeholder="Ex: media kit, apresentação, creator"
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              <div>
                <Label className="text-module-primary">Descrição Curta (opcional)</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Breve descrição sobre este conhecimento"
                  className="bg-module-input border-module text-module-primary"
                />
              </div>
              {newItem.content_type === 'pdf' ? (
                <div>
                  <Label className="text-module-primary">Upload do PDF</Label>
                  <DocumentUpload
                    label=""
                    value={newItem.content}
                    onChange={(url) => setNewItem({ ...newItem, content: url || '' })}
                    bucketName="documents"
                    folder="knowledge-base"
                    accept="application/pdf"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-module-primary">Conteúdo</Label>
                  <Textarea
                    value={newItem.content}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    placeholder={
                      newItem.content_type === 'link'
                        ? 'Cole o link aqui...'
                        : 'Digite o conteúdo completo...'
                    }
                    className="min-h-[200px] bg-module-input border-module text-module-primary"
                  />
                </div>
              )}
              <div>
                <Label className="text-module-primary">Instrução Específica (opcional)</Label>
                <Textarea
                  value={newItem.instruction}
                  onChange={(e) => setNewItem({ ...newItem, instruction: e.target.value })}
                  placeholder="Ex: Usar este conteúdo quando o cliente perguntar sobre..."
                  className="min-h-[100px] bg-module-input border-module text-module-primary"
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
        {items.length === 0 ? (
          <Card className="bg-module-card border-module">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-module-secondary" />
              <p className="text-module-secondary mb-2">
                Nenhum item de conhecimento adicionado ainda
              </p>
              <p className="text-sm text-module-secondary">
                Clique em "Adicionar Conhecimento" para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="bg-module-card border-module">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {editingId === item.id && editingItem ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-module-primary">Título</Label>
                          <Input
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            className="bg-module-input border-module text-module-primary"
                          />
                        </div>
                        <div>
                          <Label className="text-module-primary">Descrição</Label>
                          <Input
                            value={editingItem.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="bg-module-input border-module text-module-primary"
                          />
                        </div>
                        <div>
                          <Label className="text-module-primary">Palavras-chave (separadas por vírgula)</Label>
                          <Input
                            value={editingItem.keywords.join(', ')}
                            onChange={(e) => setEditingItem({ 
                              ...editingItem, 
                              keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                            })}
                            className="bg-module-input border-module text-module-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          {getIcon(item.content_type)}
                          <CardTitle className="text-base text-module-primary">{item.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {item.content_type}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-module-secondary mb-2">
                            {item.description}
                          </p>
                        )}
                        {item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingId === item.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
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
                {editingId === item.id && editingItem ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-module-primary">Conteúdo</Label>
                      <Textarea
                        value={editingItem.content}
                        onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                        className="min-h-[200px] bg-module-input border-module text-module-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-module-primary">Instrução Específica</Label>
                      <Textarea
                        value={editingItem.instruction || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, instruction: e.target.value })}
                        className="min-h-[100px] bg-module-input border-module text-module-primary"
                      />
                    </div>
                  </div>
                 ) : (
                  <>
                    <p className="text-sm text-module-primary whitespace-pre-wrap">
                      {item.content.length > 300
                        ? `${item.content.substring(0, 300)}...`
                        : item.content}
                    </p>
                    {item.instruction && (
                      <div className="mt-3 p-3 bg-module-input rounded-md">
                        <p className="text-xs font-semibold mb-1 text-module-primary">Instrução de Uso:</p>
                        <p className="text-xs text-module-secondary">{item.instruction}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
