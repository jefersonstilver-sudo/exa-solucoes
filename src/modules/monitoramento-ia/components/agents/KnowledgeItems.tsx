import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Save, X, FileText, Link as LinkIcon, File, Download, History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import DocumentUpload from '@/components/ui/document-upload';
import { useModuleTheme, getThemeClass } from '../../hooks/useModuleTheme';
import { cn } from '@/lib/utils';
import { exportKnowledgeItem } from '../../utils/exportKnowledgeItem';
import { KnowledgeItemHistoryModal } from './KnowledgeItemHistoryModal';

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
  display_order?: number;
}

interface KnowledgeItemsProps {
  items: KnowledgeItem[];
  agentId: string;
  agentKey?: string;
  agentName?: string;
}

export const KnowledgeItems = ({ items, agentId, agentKey, agentName }: KnowledgeItemsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<KnowledgeItem | null>(null);
  const { theme } = useModuleTheme();
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

    // Validar agentId
    if (!agentId || agentId.length < 10) {
      console.error('❌ Agent ID inválido:', agentId);
      setAddError(`ID do agente inválido: ${agentId}`);
      toast.error('ID do agente inválido. Recarregue a página.');
      return;
    }

    try {
      setSaving(true);
      setAddError(null);
      
      const dataToInsert = {
        agent_id: agentId,
        title: newItem.title,
        description: newItem.description,
        content: newItem.content,
        content_type: newItem.content_type,
        keywords: newItem.keywords.split(',').map(k => k.trim()).filter(Boolean),
        instruction: newItem.instruction,
        active: true
      };

      // Log dos dados antes de inserir
      console.log('📤 Inserindo knowledge item:', dataToInsert);
      
      const { data, error } = await supabase
        .from('agent_knowledge_items')
        .insert(dataToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao inserir:', error);
        setAddError(error.message);
        throw error;
      }

      // Log de sucesso
      console.log('✅ Item inserido com sucesso:', data);

      toast.success('Item de conhecimento adicionado');
      setNewItem({
        title: '',
        description: '',
        content: '',
        content_type: 'text',
        keywords: '',
        instruction: ''
      });
      setAddError(null);
      setIsAddDialogOpen(false);
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error adding knowledge item:', error);
      toast.error(`Erro ao adicionar item: ${error.message || 'Erro desconhecido'}`);
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
      
      // 1. Buscar item original para ter o valor antigo
      const originalItem = items.find(i => i.id === editingItem.id);
      
      // 2. Salvar log de modificação
      if (originalItem && agentKey) {
        await supabase.from('agent_modification_logs').insert({
          agent_key: agentKey,
          section: 'knowledge_items',
          field_modified: `knowledge_item_${editingItem.id}`,
          old_value: originalItem.content,
          new_value: editingItem.content,
          modified_by: 'admin'
        });
      }
      
      // 3. Fazer update normal
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

  const handleExportItem = (item: KnowledgeItem, index: number) => {
    exportKnowledgeItem(
      agentName || 'Agente',
      item.display_order || index + 1,
      item.title,
      item.content,
      item.keywords,
      item.description,
      item.instruction
    );
    toast.success('Item exportado com sucesso!');
  };

  const handleOpenHistory = (item: KnowledgeItem) => {
    setSelectedItemForHistory(item);
    setHistoryModalOpen(true);
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
      {/* Header - Apple Style Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'itens'} de conhecimento
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className={cn(
                "gap-2 bg-primary hover:bg-primary/90 text-primary-foreground",
                "w-full sm:w-auto",
                "h-11 px-4 rounded-full touch-manipulation"
              )}
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(
            getThemeClass(theme), 
            "w-[95vw] max-w-2xl bg-card border border-border",
            "max-h-[90vh] overflow-y-auto",
            "sm:rounded-2xl"
          )}>
            <DialogHeader>
              <DialogTitle className="text-foreground text-lg font-semibold">Novo Item de Conhecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-foreground text-sm font-medium mb-1.5 block">Tipo de Conteúdo</Label>
                <select
                  className="w-full p-3 border rounded-xl bg-background border-border text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all h-11"
                  value={newItem.content_type}
                  onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value as any })}
                >
                  <option value="text">Texto</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Link</option>
                </select>
              </div>
              <div>
                <Label className="text-foreground text-sm font-medium mb-1.5 block">Título</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Media Kit Profissional"
                  className="bg-background border-border text-foreground h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-foreground text-sm font-medium mb-1.5 block">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={newItem.keywords}
                  onChange={(e) => setNewItem({ ...newItem, keywords: e.target.value })}
                  placeholder="Ex: media kit, apresentação, creator"
                  className="bg-background border-border text-foreground h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-foreground text-sm font-medium mb-1.5 block">Descrição Curta (opcional)</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Breve descrição sobre este conhecimento"
                  className="bg-background border-border text-foreground h-11 rounded-xl"
                />
              </div>
              {newItem.content_type === 'pdf' ? (
                <div>
                  <Label className="text-foreground text-sm font-medium mb-1.5 block">Upload do PDF</Label>
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
                  <Label className="text-foreground text-sm font-medium mb-1.5 block">Conteúdo</Label>
                  <Textarea
                    value={newItem.content}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    placeholder={
                      newItem.content_type === 'link'
                        ? 'Cole o link aqui...'
                        : 'Digite o conteúdo completo...'
                    }
                    className="min-h-[200px] bg-background border-border text-foreground resize-none rounded-xl"
                  />
                </div>
              )}
              <div>
                <Label className="text-foreground text-sm font-medium mb-1.5 block">Instrução Específica (opcional)</Label>
                <Textarea
                  value={newItem.instruction}
                  onChange={(e) => setNewItem({ ...newItem, instruction: e.target.value })}
                  placeholder="Ex: Usar este conteúdo quando o cliente perguntar sobre..."
                  className="min-h-[100px] bg-background border-border text-foreground resize-none rounded-xl"
                />
              </div>
              {addError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <p className="text-sm text-destructive font-medium">Erro:</p>
                  <p className="text-xs text-destructive/80">{addError}</p>
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="h-11 px-4 rounded-full"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={saving}
                  className="h-11 px-4 rounded-full"
                >
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid - Apple Style: 1 col mobile, 2 col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Nenhum item de conhecimento</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Adicione itens para enriquecer as respostas do agente
            </p>
          </div>
        ) : (
          items.map((item, index) => (
            <Card 
              key={item.id} 
              className={cn(
                "group relative overflow-hidden",
                "bg-card border border-border/50 hover:border-border",
                "rounded-2xl transition-all duration-200",
                "active:scale-[0.98] touch-manipulation",
                editingId === item.id && "ring-2 ring-primary col-span-full"
              )}
            >
              {/* Card Content */}
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start gap-3">
                  {/* Badge número 4.X */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                    "bg-primary text-primary-foreground font-bold text-sm shadow-sm"
                  )}>
                    4.{item.display_order || index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === item.id && editingItem ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-foreground text-xs font-medium">Título</Label>
                          <Input
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            className="bg-background border-border text-foreground text-sm h-10 rounded-xl mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-xs font-medium">Descrição</Label>
                          <Input
                            value={editingItem.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="bg-background border-border text-foreground text-sm h-10 rounded-xl mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-xs font-medium">Palavras-chave</Label>
                          <Input
                            value={editingItem.keywords.join(', ')}
                            onChange={(e) => setEditingItem({ 
                              ...editingItem, 
                              keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                            })}
                            className="bg-background border-border text-foreground text-sm h-10 rounded-xl mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Title and type */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground line-clamp-2">
                            {getIcon(item.content_type)} {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          
                          {/* Keywords */}
                          {item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.keywords.slice(0, 3).map((keyword, idx) => (
                                <span 
                                  key={idx} 
                                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                                >
                                  {keyword}
                                </span>
                              ))}
                              {item.keywords.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{item.keywords.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Content preview */}
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {item.content.substring(0, 100)}...
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Action buttons - Always visible on mobile */}
              <div className={cn(
                "flex items-center gap-1 px-4 pb-4 pt-2 border-t border-border/30",
                editingId !== item.id && "sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
              )}>
                {editingId === item.id ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="h-9 px-3 rounded-full touch-manipulation text-xs"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="h-9 px-3 rounded-full touch-manipulation text-xs"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Salvar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      className="h-9 px-3 rounded-full touch-manipulation text-xs"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenHistory(item)}
                      className="h-9 px-3 rounded-full touch-manipulation text-xs"
                    >
                      <History className="h-3.5 w-3.5 mr-1.5" />
                      Histórico
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExportItem(item, index)}
                      className="hidden sm:flex h-9 px-3 rounded-full touch-manipulation text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Exportar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 rounded-full touch-manipulation text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Conteúdo expandido apenas no modo de edição */}
              {editingId === item.id && editingItem && (
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-foreground text-xs font-medium">Conteúdo</Label>
                      <Textarea
                        value={editingItem.content}
                        onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                        className="min-h-[200px] bg-background border-border text-foreground text-sm rounded-xl mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-xs font-medium">Instrução Específica</Label>
                      <Textarea
                        value={editingItem.instruction || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, instruction: e.target.value })}
                        className="min-h-[100px] bg-background border-border text-foreground text-sm rounded-xl mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modal de Histórico */}
      {selectedItemForHistory && (
        <KnowledgeItemHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedItemForHistory(null);
          }}
          itemId={selectedItemForHistory.id}
          itemTitle={selectedItemForHistory.title}
        />
      )}
    </div>
  );
};
