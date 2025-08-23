import { useState, useCallback } from 'react';

export interface BulkSelectionState {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  selectedCount: number;
}

export const useBulkSelection = (allItemIds: string[] = []) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = selectedIds.size > 0 && selectedIds.size === allItemIds.length;
  const selectedCount = selectedIds.size;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allItemIds));
    }
  }, [isAllSelected, allItemIds]);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    isAllSelected,
    selectedCount,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    isSelected: (id: string) => selectedIds.has(id)
  };
};