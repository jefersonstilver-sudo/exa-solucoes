import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
  canDelete?: boolean;
  isDeleting?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onClear,
  onDelete,
  canDelete = false,
  isDeleting = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white/95 backdrop-blur-sm border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold tabular-nums">
            {selectedCount}
          </div>
          <span className="text-sm text-slate-600 font-medium">
            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </div>

        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 shadow-sm h-8"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
