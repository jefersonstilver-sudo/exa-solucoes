
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Plus,
  MonitorPlay,
  Wifi,
  WifiOff,
  Settings,
  RefreshCw,
  Grid3X3,
  List
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePanelsData } from '@/hooks/usePanelsData';
import PanelFormDialog from '@/components/admin/panels/PanelFormDialog';
import PanelDetailsDialog from '@/components/admin/panels/PanelDetailsDialog';
import PanelConfigCard from '@/components/admin/panels/PanelConfigCard';
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

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.buildings?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Painéis</h1>
        <p className="text-gray-600 mt-2">Monitore e gerencie todos os painéis digitais</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={handleNewPanel}
            className="bg-indexa-purple hover:bg-indexa-purple-dark text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Painel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Total de Painéis</CardTitle>
            <MonitorPlay className="h-6 w-6 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center">
                <Wifi className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">{stats.online} Online</span>
              </div>
              <div className="flex items-center">
                <WifiOff className="h-4 w-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600">{stats.offline} Offline</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Status Geral</CardTitle>
            <Settings className="h-6 w-6 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Operacional:</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Manutenção:</span>
                <span className="text-sm font-medium text-orange-500">{stats.maintenance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Offline:</span>
                <span className="text-sm font-medium text-red-600">{stats.offline}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por código, prédio, modelo ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('online')}>
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('offline')}>
                  Offline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('maintenance')}>
                  Manutenção
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  SO: {osFilter === 'all' ? 'Todos' : osFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOsFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOsFilter('windows')}>
                  Windows
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOsFilter('linux')}>
                  Linux
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOsFilter('android')}>
                  Android
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1 min-w-[120px]">
                  Orientação: {orientationFilter === 'all' ? 'Todas' : orientationFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOrientationFilter('all')}>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOrientationFilter('horizontal')}>
                  Horizontal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOrientationFilter('vertical')}>
                  Vertical
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Visualização:</span>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panels Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Painéis</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredPanels.length} painéis encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPanels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MonitorPlay className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum painel encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || osFilter !== 'all' || orientationFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro painel'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && osFilter === 'all' && orientationFilter === 'all' && (
                <Button onClick={handleNewPanel} className="bg-indexa-purple hover:bg-indexa-purple-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Painel
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPanels.map((panel) => (
                <PanelConfigCard
                  key={panel.id}
                  panel={panel}
                  onView={handleViewPanel}
                  onEdit={handleEditPanel}
                  onDelete={handleDeletePanel}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPanels.map((panel) => {
                const statusInfo = getStatusInfo(panel.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={panel.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                        <MonitorPlay className="h-6 w-6 text-indexa-purple" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{panel.code}</h3>
                          <Badge variant={statusInfo.variant} className="text-xs flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 mt-2">
                          {panel.marca && (
                            <p className="text-sm text-gray-500">Marca: {panel.marca}</p>
                          )}
                          {panel.polegada && (
                            <p className="text-sm text-gray-500">Tamanho: {panel.polegada}"</p>
                          )}
                          {panel.resolucao && (
                            <p className="text-sm text-gray-500">Resolução: {panel.resolucao}</p>
                          )}
                          {panel.sistema_operacional && (
                            <p className="text-sm text-gray-500">SO: {panel.sistema_operacional}</p>
                          )}
                        </div>
                        {panel.buildings?.nome && (
                          <p className="text-sm text-gray-400 mt-1">
                            📍 {panel.buildings.nome}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewPanel(panel)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPanel(panel)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePanel(panel)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
