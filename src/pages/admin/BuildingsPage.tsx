
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Plus,
  Building2,
  MapPin,
  MonitorPlay,
  Users,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BuildingsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const buildings = [
    {
      id: '1',
      name: 'Shopping Center Norte',
      address: 'Av. Otto Baumgart, 500 - Vila Guilherme, São Paulo - SP',
      type: 'Shopping',
      panelsCount: 12,
      activeFlights: 8,
      totalCapacity: 50000,
      coordinates: { lat: -23.5041, lng: -46.6193 },
      status: 'active'
    },
    {
      id: '2',
      name: 'Edifício Comercial Paulista',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      type: 'Edifício Comercial',
      panelsCount: 8,
      activeFlights: 5,
      totalCapacity: 30000,
      coordinates: { lat: -23.5605, lng: -46.6566 },
      status: 'active'
    },
    {
      id: '3',
      name: 'Centro Comercial Downtown',
      address: 'R. XV de Novembro, 200 - Centro, São Paulo - SP',
      type: 'Centro Comercial',
      panelsCount: 6,
      activeFlights: 2,
      totalCapacity: 20000,
      coordinates: { lat: -23.5431, lng: -46.6291 },
      status: 'maintenance'
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      active: { variant: 'success', label: 'Ativo' },
      maintenance: { variant: 'secondary', label: 'Manutenção' },
      inactive: { variant: 'destructive', label: 'Inativo' }
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const filteredBuildings = buildings.filter(building =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Prédios</h1>
          <p className="text-slate-400">Cadastre e gerencie locais dos painéis digitais</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
          <Plus className="h-4 w-4 mr-2" />
          Novo Prédio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total de Prédios</CardTitle>
            <Building2 className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">24</div>
            <p className="text-xs text-green-400">+3 este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Painéis Instalados</CardTitle>
            <MonitorPlay className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">89</div>
            <p className="text-xs text-blue-400">Média 3.7 por prédio</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Campanha Ativas</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">156</div>
            <p className="text-xs text-green-400">Em 18 prédios</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Capacidade Total</CardTitle>
            <Eye className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">2.4M</div>
            <p className="text-xs text-purple-400">visualizações/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Buscar Prédios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, endereço ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Buildings List */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Lista de Prédios</CardTitle>
          <CardDescription className="text-slate-400">
            {filteredBuildings.length} prédios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBuildings.map((building) => {
              const statusInfo = getStatusBadge(building.status);
              
              return (
                <div key={building.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-white">{building.name}</h3>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          {building.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <p className="text-sm text-slate-400">{building.address}</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-1">
                          <MonitorPlay className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-slate-400">{building.panelsCount} painéis</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-slate-400">{building.activeFlights} campanhas ativas</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3 text-purple-400" />
                          <span className="text-xs text-slate-400">{building.totalCapacity.toLocaleString()} visualizações/mês</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
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
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300">
                          <MapPin className="h-4 w-4 mr-2" />
                          Ver no Mapa
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

export default BuildingsPage;
