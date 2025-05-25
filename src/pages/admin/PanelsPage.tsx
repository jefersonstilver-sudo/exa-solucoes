
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePanelsData } from '@/hooks/usePanelsData';
import PanelFormDialog from '@/components/admin/panels/PanelFormDialog';
import PanelDetailsDialog from '@/components/admin/panels/PanelDetailsDialog';
import PanelsHeader from '@/components/admin/panels/PanelsHeader';
import PanelsStatsCards from '@/components/admin/panels/PanelsStatsCards';
import PanelsFilters from '@/components/admin/panels/PanelsFilters';
import PanelsDisplay from '@/components/admin/panels/PanelsDisplay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PanelsPage = () => {
  const { panels, stats, loading, refetch } = usePanelsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [osFilter, setOsFilter] = useState('all');
  const [orientationFilter, setOrientationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<any>(null);

  const handleNewPanel = () => {
    setSelectedPanel(null);
    setFormDialogOpen(true);
  };

  const handleEditPanel = (panel: any) => {
    setSelectedPanel(panel);
    setFormDialogOpen(true);
  };

  const handleViewPanel = (panel: any) => {
    setSelectedPanel(panel);
    setDetailsDialogOpen(true);
  };

  const handleDeletePanel = async (panel: any) => {
    if (!confirm(`Tem certeza que deseja excluir o painel ${panel.code}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('painels')
        .delete()
        .eq('id', panel.id);

      if (error) throw error;

      toast.success('Painel excluído com sucesso!');
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir painel:', error);
      toast.error('Erro ao excluir painel');
    }
  };

  const handleSuccess = () => {
    refetch();
  };

  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.buildings?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.modelo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || panel.status === statusFilter;
    const matchesOs = osFilter === 'all' || panel.sistema_operacional === osFilter;
    const matchesOrientation = orientationFilter === 'all' || panel.orientacao === orientationFilter;
    
    return matchesSearch && matchesStatus && matchesOs && matchesOrientation;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando painéis...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PanelsHeader
        onRefresh={refetch}
        onNewPanel={handleNewPanel}
        loading={loading}
      />

      <PanelsStatsCards stats={stats} />

      <PanelsFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        osFilter={osFilter}
        setOsFilter={setOsFilter}
        orientationFilter={orientationFilter}
        setOrientationFilter={setOrientationFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <PanelsDisplay
        filteredPanels={filteredPanels}
        viewMode={viewMode}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        osFilter={osFilter}
        orientationFilter={orientationFilter}
        onViewPanel={handleViewPanel}
        onEditPanel={handleEditPanel}
        onDeletePanel={handleDeletePanel}
        onNewPanel={handleNewPanel}
      />

      {/* Dialogs */}
      <PanelFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        panel={selectedPanel}
        onSuccess={handleSuccess}
      />

      <PanelDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        panel={selectedPanel}
      />
    </div>
  );
};

export default PanelsPage;
