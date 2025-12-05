import React, { useState, useCallback } from 'react';
import { ProposalMobileCard } from './ProposalMobileCard';
import { ProposalSelectionToolbar } from './ProposalSelectionToolbar';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj?: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_panels: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  duration_months: number;
  status: string;
  created_at: string;
  view_count: number | null;
  total_time_spent_seconds: number | null;
  is_viewing?: boolean;
  last_heartbeat_at?: string | null;
}

interface ProposalMobileListProps {
  proposals: Proposal[];
  loading?: boolean;
  onViewDetails: (proposalId: string) => void;
  onBulkDelete?: (proposalIds: string[]) => Promise<void>;
}

export const ProposalMobileList: React.FC<ProposalMobileListProps> = ({
  proposals,
  loading = false,
  onViewDetails,
  onBulkDelete,
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const proposalIds = proposals.map(p => p.id);
  const {
    selectedIds,
    isAllSelected,
    selectedCount,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
  } = useBulkSelection(proposalIds);

  const handleLongPress = useCallback((proposalId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toggleSelectItem(proposalId);
    }
  }, [isSelectionMode, toggleSelectItem]);

  const handleClearSelection = useCallback(() => {
    clearSelection();
    setIsSelectionMode(false);
  }, [clearSelection]);

  const handleDelete = useCallback(async () => {
    if (!onBulkDelete || selectedCount === 0) return;
    
    setIsDeleting(true);
    try {
      await onBulkDelete(Array.from(selectedIds));
      handleClearSelection();
    } finally {
      setIsDeleting(false);
    }
  }, [onBulkDelete, selectedIds, selectedCount, handleClearSelection]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-lg font-medium text-foreground">Nenhuma proposta encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          As propostas aparecerão aqui quando forem criadas
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 pb-24">
        {proposals.map((proposal) => (
          <ProposalMobileCard
            key={proposal.id}
            proposal={proposal}
            onViewDetails={onViewDetails}
            isSelectionMode={isSelectionMode}
            isSelected={selectedIds.has(proposal.id)}
            onLongPress={() => handleLongPress(proposal.id)}
            onToggleSelect={() => toggleSelectItem(proposal.id)}
          />
        ))}
      </div>

      <ProposalSelectionToolbar
        selectedCount={selectedCount}
        totalCount={proposals.length}
        onSelectAll={toggleSelectAll}
        onClearSelection={handleClearSelection}
        onDelete={handleDelete}
        isAllSelected={isAllSelected}
        isDeleting={isDeleting}
      />
    </>
  );
};
