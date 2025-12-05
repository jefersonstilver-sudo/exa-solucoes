import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProposalSelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  isAllSelected: boolean;
  isDeleting?: boolean;
}

export const ProposalSelectionToolbar: React.FC<ProposalSelectionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  isAllSelected,
  isDeleting = false,
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl">
            <div className="px-4 py-3 space-y-2">
              {/* Selection info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#9C1E1E] flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{selectedCount}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {selectedCount} de {totalCount} selecionada{selectedCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={onClearSelection}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSelectAll}
                  className="flex-1 h-10 text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  {isAllSelected ? 'Desmarcar' : 'Selecionar'} Todas
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="flex-1 h-10 text-sm bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1.5" />
                  )}
                  Excluir ({selectedCount})
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
