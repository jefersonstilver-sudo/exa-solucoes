import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings2, 
  Search, 
  Plus, 
  Pencil, 
  Check, 
  X, 
  Loader2,
  Tag,
  ChevronRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useBusinessSegments, BusinessSegment } from '@/hooks/useBusinessSegments';
import { cn } from '@/lib/utils';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.label.toLowerCase().includes(term) ||
        s.value.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(s => s.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(s => !s.is_active);
    }

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

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

  // Expand all categories by default when searching
  React.useEffect(() => {
    if (searchTerm) {
      setExpandedCategories(new Set(Object.keys(filteredAndGrouped)));
    }
  }, [searchTerm, filteredAndGrouped]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl p-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-l border-white/20"
      >
        {/* Glassmorphism Header */}
        <SheetHeader className="sticky top-0 z-20 px-6 py-5 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] shadow-lg">
                <Settings2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gestão de Segmentos
                </SheetTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activeCount} de {totalCount} ativos
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Content with Scroll */}
        <div className="flex flex-col h-[calc(100vh-88px)] overflow-hidden">
          {/* Filters - Sticky */}
          <div className="flex-shrink-0 px-6 py-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200/50 dark:border-white/5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar segmento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-[#9C1E1E]/20 transition-all"
              />
            </div>
            
            {/* Filter Pills */}
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-auto min-w-[140px] bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 rounded-full text-sm shadow-sm">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700 rounded-xl shadow-2xl">
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="h-9 w-auto min-w-[110px] bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 rounded-full text-sm shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/50 dark:border-gray-700 rounded-xl shadow-2xl">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => setIsCreateMode(true)}
                disabled={isCreateMode}
                size="sm"
                className="h-9 px-4 rounded-full bg-gradient-to-r from-[#9C1E1E] to-[#B72A2A] hover:from-[#7D1818] hover:to-[#9C1E1E] shadow-lg shadow-red-500/20 transition-all"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {/* Create New Form */}
            {isCreateMode && (
              <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                  <Tag className="h-4 w-4 text-[#9C1E1E]" />
                  Novo Segmento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="newLabel" className="text-xs text-gray-500">Nome *</Label>
                    <Input
                      id="newLabel"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Ex: Restaurantes..."
                      autoFocus
                      className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newCategory" className="text-xs text-gray-500">Categoria</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl">
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
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={handleCancelCreate} className="rounded-full">
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleCreateNew}
                    disabled={!newLabel.trim() || isCreating}
                    className="rounded-full bg-gradient-to-r from-[#9C1E1E] to-[#B72A2A] hover:from-[#7D1818] hover:to-[#9C1E1E]"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Criar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Segments List */}
            {isLoadingAll ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#9C1E1E] mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Carregando segmentos...</p>
                </div>
              </div>
            ) : Object.keys(filteredAndGrouped).length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Tag className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum segmento encontrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Ajuste os filtros ou crie um novo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(filteredAndGrouped)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, segments]) => {
                    const isExpanded = expandedCategories.has(category);
                    
                    return (
                      <div 
                        key={category} 
                        className="rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 overflow-hidden shadow-sm"
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                              <Layers className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                              {category}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                              {segments.length}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        {/* Segments */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-gray-700/50">
                            {segments.map((segment, idx) => (
                              <div 
                                key={segment.id}
                                className={cn(
                                  "flex items-center justify-between px-4 py-3 transition-colors",
                                  idx !== segments.length - 1 && "border-b border-gray-100 dark:border-gray-700/30",
                                  !segment.is_active && "opacity-50"
                                )}
                              >
                                {editingId === segment.id ? (
                                  // Edit Mode
                                  <div className="flex-1 flex items-center gap-2">
                                    <Input
                                      value={editLabel}
                                      onChange={(e) => setEditLabel(e.target.value)}
                                      className="h-9 flex-1 rounded-lg"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit();
                                        if (e.key === 'Escape') handleCancelEdit();
                                      }}
                                    />
                                    <Select value={editCategory} onValueChange={setEditCategory}>
                                      <SelectTrigger className="h-9 w-[100px] rounded-lg">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl">
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
                                      className="h-9 w-9 rounded-lg"
                                      onClick={handleSaveEdit}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4 text-emerald-600" />
                                      )}
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-9 w-9 rounded-lg"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4 text-gray-400" />
                                    </Button>
                                  </div>
                                ) : (
                                  // View Mode
                                  <>
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className={cn(
                                        "text-sm text-gray-700 dark:text-gray-300 truncate",
                                        !segment.is_active && "line-through"
                                      )}>
                                        {segment.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
                                        onClick={() => handleStartEdit(segment)}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Switch
                                        checked={segment.is_active}
                                        onCheckedChange={() => handleToggleStatus(segment)}
                                        disabled={isToggling}
                                        className="data-[state=checked]:bg-[#9C1E1E]"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Object.values(filteredAndGrouped).flat().length} segmentos
              </p>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="rounded-full border-gray-200 dark:border-gray-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SegmentManagerModal;
