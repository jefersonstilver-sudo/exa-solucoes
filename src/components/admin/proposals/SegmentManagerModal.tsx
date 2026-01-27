import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Search, 
  Plus, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  Tag,
  FolderOpen
} from 'lucide-react';
import { useBusinessSegments, BusinessSegment } from '@/hooks/useBusinessSegments';

interface SegmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SegmentManagerModal: React.FC<SegmentManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    allSegments,
    isLoadingAll,
    categories,
    createSegment,
    isCreating,
    updateSegment,
    isUpdating,
    toggleSegment,
    isToggling
  } = useBusinessSegments();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Create mode state
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('outros');

  // Filter and group segments
  const filteredAndGrouped = useMemo(() => {
    let filtered = allSegments;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.label.toLowerCase().includes(term) ||
        s.value.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(s => !s.is_active);
    }

    // Group by category
    const grouped: Record<string, BusinessSegment[]> = {};
    filtered.forEach(segment => {
      const cat = segment.category || 'outros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(segment);
    });

    return grouped;
  }, [allSegments, searchTerm, categoryFilter, statusFilter]);

  const totalCount = allSegments.length;
  const activeCount = allSegments.filter(s => s.is_active).length;

  const handleStartEdit = (segment: BusinessSegment) => {
    setEditingId(segment.id);
    setEditLabel(segment.label);
    setEditCategory(segment.category);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
    setEditCategory('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editLabel.trim()) return;
    
    try {
      await updateSegment({
        id: editingId,
        label: editLabel,
        category: editCategory
      });
      handleCancelEdit();
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleToggleStatus = async (segment: BusinessSegment) => {
    try {
      await toggleSegment({
        id: segment.id,
        is_active: !segment.is_active
      });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCreateNew = async () => {
    if (!newLabel.trim()) return;
    
    try {
      await createSegment({
        label: newLabel,
        category: newCategory
      });
      setNewLabel('');
      setNewCategory('outros');
      setIsCreateMode(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleCancelCreate = () => {
    setIsCreateMode(false);
    setNewLabel('');
    setNewCategory('outros');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestão de Segmentos
            <Badge variant="secondary" className="ml-2">
              {activeCount}/{totalCount} ativos
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-2 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar segmento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsCreateMode(true)}
            disabled={isCreateMode}
            className="bg-[#9C1E1E] hover:bg-[#7D1818]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </div>

        {/* Create New Form */}
        {isCreateMode && (
          <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Novo Segmento
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="newLabel" className="text-xs">Nome do Segmento *</Label>
                <Input
                  id="newLabel"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ex: Restaurantes, Academias..."
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="newCategory" className="text-xs">Categoria</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelCreate}>
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleCreateNew}
                disabled={!newLabel.trim() || isCreating}
                className="bg-[#9C1E1E] hover:bg-[#7D1818]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Criar Segmento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Segments List */}
        <ScrollArea className="flex-1 min-h-0 pr-4">
          {isLoadingAll ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : Object.keys(filteredAndGrouped).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum segmento encontrado</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(filteredAndGrouped)}>
              {Object.entries(filteredAndGrouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, segments]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{category}</span>
                        <Badge variant="secondary" className="ml-1">
                          {segments.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-6">
                        {segments.map(segment => (
                          <div 
                            key={segment.id}
                            className={`flex items-center justify-between p-2 rounded-md border ${
                              segment.is_active 
                                ? 'bg-background border-border' 
                                : 'bg-muted/50 border-muted text-muted-foreground'
                            }`}
                          >
                            {editingId === segment.id ? (
                              // Edit Mode
                              <div className="flex-1 flex items-center gap-2">
                                <Input
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  className="h-8 flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Select value={editCategory} onValueChange={setEditCategory}>
                                  <SelectTrigger className="h-8 w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={handleSaveEdit}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`truncate ${!segment.is_active ? 'line-through' : ''}`}>
                                    {segment.label}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    ({segment.value})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => handleStartEdit(segment)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Switch
                                    checked={segment.is_active}
                                    onCheckedChange={() => handleToggleStatus(segment)}
                                    disabled={isToggling}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {Object.values(filteredAndGrouped).flat().length} segmentos exibidos
          </p>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SegmentManagerModal;