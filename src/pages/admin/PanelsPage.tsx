
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
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PanelsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const panels = [
    {
      id: '1',
      code: 'P001',
      name: 'Painel Shopping Center Norte',
      building: 'Shopping Center Norte',
      location: 'São Paulo, SP',
      status: 'online',
      resolution: '1920x1080',
      lastSync: '2024-01-15 14:30',
      campaigns: 3
    },
    {
      id: '2',
      code: 'P002',
      name: 'Painel Av. Paulista',
      building: 'Edifício Comercial Paulista',
      location: 'São Paulo, SP',
      status: 'offline',
      resolution: '1920x1080',
      lastSync: '2024-01-14 10:15',
      campaigns: 1
    },
    {
      id: '3',
      code: 'P003',
      name: 'Painel Centro Comercial',
      building: 'Centro Comercial Downtown',
      location: 'São Paulo, SP',
      status: 'maintenance',
      resolution: '1366x768',
      lastSync: '2024-01-13 16:45',
      campaigns: 0
    },
  ];

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { variant: any, label: string, icon: any, color: string }> = {
      online: { variant: 'success', label: 'Online', icon: Wifi, color: 'text-green-400' },
      offline: { variant: 'destructive', label: 'Offline', icon: WifiOff, color: 'text-red-400' },
      maintenance: { variant: 'secondary', label: 'Manutenção', icon: Settings, color: 'text-orange-400' }
    };
    return statusMap[status] || statusMap.offline;
  };

  const filteredPanels = panels.filter(panel => {
    const matchesSearch = panel.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         panel.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || panel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Painéis</h1>
          <p className="text-slate-400">Monitore e gerencie todos os painéis digitais</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
          <Plus className="h-4 w-4 mr-2" />
          Novo Painel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Painéis</CardTitle>
            <MonitorPlay className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">89</div>
            <p className="text-xs text-green-400">+5 este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">67</div>
            <p className="text-xs text-green-400">75% operational</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">15</div>
            <p className="text-xs text-red-400">Requer atenção</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Manutenção</CardTitle>
            <Settings className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">7</div>
            <p className="text-xs text-orange-400">Em manutenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por código, nome ou prédio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-slate-300">
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('online')} className="text-slate-300">
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('offline')} className="text-slate-300">
                  Offline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('maintenance')} className="text-slate-300">
                  Manutenção
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Panels List */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Lista de Painéis</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredPanels.length} painéis encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPanels.map((panel) => {
              const statusInfo = getStatusInfo(panel.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={panel.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <MonitorPlay className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">{panel.code}</h3>
                        <Badge variant={statusInfo.variant} className="text-xs flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">{panel.name}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <p className="text-xs text-slate-400">{panel.building}</p>
                        </div>
                        <p className="text-xs text-slate-400">Resolução: {panel.resolution}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-white">{panel.campaigns} campanhas ativas</p>
                      <p className="text-xs text-slate-400">Última sync: {panel.lastSync}</p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PanelsPage;
