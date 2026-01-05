import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { KanbanBoard, KanbanHeader } from '@/components/contatos/kanban';
import { useKanbanContatos, KanbanGroupBy } from '@/hooks/contatos/useKanbanContatos';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ContatosKanbanPage = () => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  
  const [groupBy, setGroupBy] = useState<KanbanGroupBy>('categoria');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { columns, loading, moveContact, refetch } = useKanbanContatos({
    groupBy,
    search: searchQuery
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const totalContacts = columns.reduce((sum, col) => sum + col.count, 0);

  if (loading && columns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-gray-50 to-slate-100">
      {/* Header */}
      <div className="p-4 pb-0">
        <KanbanHeader
          viewMode="kanban"
          onViewModeChange={(mode) => {
            if (mode === 'list') {
              navigate(buildPath('contatos'));
            }
          }}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenFilters={() => {}}
          activeFiltersCount={0}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          totalContacts={totalContacts}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          columns={columns}
          onMoveContact={moveContact}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ContatosKanbanPage;
