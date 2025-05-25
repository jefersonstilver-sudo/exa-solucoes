
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
  MapPin,
  Wifi,
  WifiOff,
  Settings,
  Eye,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePanelsData } from '@/hooks/usePanelsData';

const PanelsPage = () => {
  const { panels, stats, loading, refetch } = usePanelsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-600' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-500' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || panel.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Painéis</h1>
          <p className="text-gray-600">Monitore e gerencie todos os painéis digitais</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Painel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Painéis</CardTitle>
            <MonitorPlay className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-green-600">Sistema conectado</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.online}</div>
            <p className="text-xs text-green-600">{stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0}% operacional</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.offline}</div>
            <p className="text-xs text-red-600">Requer atenção</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Manutenção</CardTitle>
            <Settings className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.maintenance}</div>
            <p className="text-xs text-orange-500">Em manutenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por código do painel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
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
          </div>
        </CardContent>
      </Card>

      {/* Panels List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Lista de Painéis</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredPanels.length} painéis encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPanels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MonitorPlay className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Nenhum painel encontrado</p>
              </div>
            ) : (
              filteredPanels.map((panel) => {
                const statusInfo = getStatusInfo(panel.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={panel.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                        <MonitorPlay className="h-6 w-6 text-indexa-purple" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{panel.code}</h3>
                          <Badge variant={statusInfo.variant} className="text-xs flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          {panel.resolucao && (
                            <p className="text-xs text-gray-500">Resolução: {panel.resolucao}</p>
                          )}
                          {panel.modo && (
                            <p className="text-xs text-gray-500">Modo: {panel.modo}</p>
                          )}
                        </div>
                        {panel.ultima_sync && (
                          <p className="text-xs text-gray-400 mt-1">
                            Última sync: {new Date(panel.ultima_sync).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-700 font-medium">ID do Prédio</p>
                        <p className="text-xs text-gray-500">{panel.building_id?.substring(0, 8)}...</p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PanelsPage;
