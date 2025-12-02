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
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-semibold text-module-primary">
            Conhecimento ({items.length} itens)
          </h3>
          <p className="text-sm text-module-secondary">
            Documentos, links e textos que o agente pode consultar
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className={cn(
                "gap-2 bg-module-accent hover:bg-module-accent-hover",
                "w-full sm:w-auto",
                "min-h-[44px] touch-manipulation"
              )}
            >
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Adicionar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className={cn(
            getThemeClass(theme), 
            "w-[95vw] max-w-5xl bg-module-card border-2 border-module text-module-primary",
            "max-h-[90vh] overflow-y-auto",
            "rounded-2xl"
          )}>
            <DialogHeader>
              <DialogTitle className="text-module-primary text-xl font-bold">Novo Item de Conhecimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-module-primary font-semibold mb-2 block">Tipo de Conteúdo</Label>
                <select
                  className="w-full mt-1 p-3 border rounded-xl bg-module-secondary border-module text-module-primary focus:border-module-accent focus:outline-none focus:ring-2 focus:ring-module-accent/30 transition-all min-h-[44px]"
                  value={newItem.content_type}
                  onChange={(e) => setNewItem({ ...newItem, content_type: e.target.value as any })}
                >
                  <option value="text" className="bg-module-secondary">Texto</option>
                  <option value="pdf" className="bg-module-secondary">PDF</option>
                  <option value="link" className="bg-module-secondary">Link</option>
                </select>
              </div>
              <div>
                <Label className="text-module-primary font-semibold mb-2 block">Título</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Media Kit Profissional"
                  className="bg-module-secondary border-module text-module-primary placeholder:text-module-secondary focus:border-module-accent focus:ring-2 focus:ring-module-accent/30 transition-all min-h-[44px] rounded-xl"
                />
              </div>
              <div>
                <Label className="text-module-primary font-semibold mb-2 block">Palavras-chave (separadas por vírgula)</Label>
                <Input
                  value={newItem.keywords}
                  onChange={(e) => setNewItem({ ...newItem, keywords: e.target.value })}
                  placeholder="Ex: media kit, apresentação, creator"
                  className="bg-module-secondary border-module text-module-primary placeholder:text-module-secondary focus:border-module-accent focus:ring-2 focus:ring-module-accent/30 transition-all min-h-[44px] rounded-xl"
                />
              </div>
              <div>
                <Label className="text-module-primary font-semibold mb-2 block">Descrição Curta (opcional)</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Breve descrição sobre este conhecimento"
                  className="bg-module-secondary border-module text-module-primary placeholder:text-module-secondary focus:border-module-accent focus:ring-2 focus:ring-module-accent/30 transition-all min-h-[44px] rounded-xl"
                />
              </div>
              {newItem.content_type === 'pdf' ? (
                <div>
                  <Label className="text-white font-semibold mb-2 block">Upload do PDF</Label>
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
                  <Label className="text-module-primary font-semibold mb-2 block">Conteúdo</Label>
                  <Textarea
                    value={newItem.content}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    placeholder={
                      newItem.content_type === 'link'
                        ? 'Cole o link aqui...'
                        : 'Digite o conteúdo completo...'
                    }
                    className="min-h-[200px] bg-module-secondary border-module text-module-primary placeholder:text-module-secondary focus:border-module-accent focus:ring-2 focus:ring-module-accent/30 transition-all resize-none rounded-xl"
                  />
                </div>
              )}
              <div>
                <Label className="text-module-primary font-semibold mb-2 block">Instrução Específica (opcional)</Label>
                <Textarea
                  value={newItem.instruction}
                  onChange={(e) => setNewItem({ ...newItem, instruction: e.target.value })}
                  placeholder="Ex: Usar este conteúdo quando o cliente perguntar sobre..."
                  className="min-h-[100px] bg-module-secondary border-module text-module-primary placeholder:text-module-secondary focus:border-module-accent focus:ring-2 focus:ring-module-accent/30 transition-all resize-none rounded-xl"
                />
              </div>
              {addError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl">
                  <p className="text-sm text-red-400 font-semibold">Erro:</p>
                  <p className="text-xs text-red-300">{addError}</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-module">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-module text-module-primary hover:bg-module-secondary min-h-[44px] rounded-xl order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAdd} 
                  disabled={saving}
                  className="bg-module-accent hover:bg-module-accent-hover text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] rounded-xl order-1 sm:order-2"
                >
                  {saving ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid - Single column on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {items.length === 0 ? (
          <Card className="bg-module-card border-module col-span-full">
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
          items.map((item, index) => (
            <Card 
              key={item.id} 
              className={cn(
                "bg-module-card border-module group relative overflow-hidden rounded-xl",
                "transition-all duration-300 ease-out",
                "lg:hover:shadow-lg lg:hover:scale-[1.02] lg:hover:border-module-accent",
                "active:scale-[0.98] touch-manipulation",
                editingId === item.id && "ring-2 ring-module-accent col-span-full"
              )}
            >
              {/* Número do card com 4.X - Badge proeminente */}
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-module-accent flex items-center justify-center text-white font-bold text-sm z-10 shadow-md">
                4.{item.display_order || index + 1}
              </div>

              <CardHeader className="pb-3 pt-14 px-4 lg:px-6">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {editingId === item.id && editingItem ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-module-primary text-xs">Título</Label>
                          <Input
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                            className="bg-module-input border-module text-module-primary text-sm min-h-[44px] rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-module-primary text-xs">Descrição</Label>
                          <Input
                            value={editingItem.description || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="bg-module-input border-module text-module-primary text-sm min-h-[44px] rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-module-primary text-xs">Palavras-chave</Label>
                          <Input
                            value={editingItem.keywords.join(', ')}
                            onChange={(e) => setEditingItem({ 
                              ...editingItem, 
                              keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                            })}
                            className="bg-module-input border-module text-module-primary text-sm min-h-[44px] rounded-xl"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-2 mb-2">
                          <div className="mt-0.5 flex-shrink-0 text-module-secondary">
                            {getIcon(item.content_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm lg:text-base font-semibold text-module-primary line-clamp-2 group-hover:text-module-accent transition-colors">
                              {item.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                                {item.content_type}
                              </Badge>
                              {item.keywords.length > 0 && (
                                <span className="text-xs text-module-secondary hidden sm:inline">
                                  {item.keywords.length} tags
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Description always visible on mobile, hover on desktop */}
                        {item.description && (
                          <p className="text-xs text-module-secondary mt-2 line-clamp-2 lg:line-clamp-1 lg:max-h-0 lg:opacity-0 lg:overflow-hidden lg:transition-all lg:duration-300 lg:group-hover:max-h-20 lg:group-hover:opacity-100">
                            {item.description}
                          </p>
                        )}

                        {/* Keywords - visible on hover for desktop */}
                        {item.keywords.length > 0 && (
                          <div className="hidden lg:flex flex-wrap gap-1 mt-2 max-h-0 opacity-0 overflow-hidden transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100">
                            {item.keywords.slice(0, 4).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs rounded-full">
                                {keyword}
                              </Badge>
                            ))}
                            {item.keywords.length > 4 && (
                              <Badge variant="outline" className="text-xs rounded-full">
                                +{item.keywords.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Action buttons - Always visible on mobile, hover on desktop */}
                  <div className="flex gap-1 flex-shrink-0">
                    {editingId === item.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="h-10 w-10 lg:h-8 lg:w-8 p-0 rounded-full touch-manipulation"
                        >
                          <X className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="h-10 w-10 lg:h-8 lg:w-8 p-0 text-module-accent rounded-full touch-manipulation"
                        >
                          <Save className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                          className="h-10 w-10 lg:h-8 lg:w-8 p-0 rounded-full touch-manipulation hover:bg-module-accent/20"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenHistory(item)}
                          className="h-10 w-10 lg:h-8 lg:w-8 p-0 rounded-full touch-manipulation hover:bg-purple-500/20"
                          title="Histórico"
                        >
                          <History className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportItem(item, index)}
                          className="hidden sm:flex h-10 w-10 lg:h-8 lg:w-8 p-0 rounded-full touch-manipulation hover:bg-blue-500/20"
                          title="Exportar"
                        >
                          <Download className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-10 w-10 lg:h-8 lg:w-8 p-0 text-destructive rounded-full touch-manipulation hover:bg-destructive/20"
                          onClick={() => handleDelete(item.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Conteúdo expandido apenas no modo de edição */}
              {editingId === item.id && editingItem && (
                <CardContent className="pt-0 px-4 lg:px-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-module-primary text-xs">Conteúdo</Label>
                      <Textarea
                        value={editingItem.content}
                        onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                        className="min-h-[200px] bg-module-input border-module text-module-primary text-sm rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-module-primary text-xs">Instrução Específica</Label>
                      <Textarea
                        value={editingItem.instruction || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, instruction: e.target.value })}
                        className="min-h-[100px] bg-module-input border-module text-module-primary text-sm rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Preview do conteúdo - Desktop: hover only, Mobile: tap to see */}
              {editingId !== item.id && (
                <div className="lg:max-h-0 lg:opacity-0 overflow-hidden transition-all duration-300 lg:group-hover:max-h-32 lg:group-hover:opacity-100 px-4 lg:px-6 pb-4">
                  <div className="text-xs text-module-secondary line-clamp-2 lg:line-clamp-3 whitespace-pre-wrap border-t border-module/50 pt-3">
                    {item.content.substring(0, 150)}...
                  </div>
                  {item.instruction && (
                    <div className="mt-2 pt-2 border-t border-module/30">
                      <p className="text-xs font-semibold text-module-accent">Instrução:</p>
                      <p className="text-xs text-module-secondary line-clamp-2">{item.instruction}</p>
                    </div>
                  )}
                </div>
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
