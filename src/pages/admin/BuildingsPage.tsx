
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
  MoreHorizontal,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBuildingsData } from '@/hooks/useBuildingsData';
import { useAuth } from '@/hooks/useAuth';

const BuildingsPage = () => {
  const { buildings, stats, loading, refetch } = useBuildingsData();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      ativo: { variant: 'success', label: 'Ativo' },
      inativo: { variant: 'secondary', label: 'Inativo' },
      manutencao: { variant: 'destructive', label: 'Manutenção' }
    };
    return variants[status] || { variant: 'secondary', label: status };
  };

  const filteredBuildings = buildings.filter(building =>
    building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.bairro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
          <span className="ml-2 text-indexa-purple">Carregando prédios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Prédios</h1>
          <p className="text-gray-600">Cadastre e gerencie locais dos painéis digitais</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple-dark text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Prédio
          </Button>
        </div>
      </div>

      {/* Status da conexão e dados */}
      <Card className={`${buildings.length > 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            {buildings.length > 0 ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    RLS Corrigido - Dados Carregados!
                  </h3>
                  <p className="text-green-700 text-sm">
                    {stats.total} prédios encontrados • Super Admin: {userProfile?.email}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Conectado - Nenhum Prédio Encontrado</h3>
                  <p className="text-orange-700 text-sm">
                    Base de dados vazia ou sem permissões • Usuário: {userProfile?.email}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total de Prédios</CardTitle>
            <Building2 className="h-4 w-4 text-indexa-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-600">
              <Database className="h-3 w-3 inline mr-1" />
              RLS Funcionando
            </p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Prédios Ativos</CardTitle>
            <MonitorPlay className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
            <p className="text-xs text-blue-600">Operacionais</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Inativos</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
            <p className="text-xs text-orange-500">Requer atenção</p>
          </CardContent>
        </Card>

        <Card className="border-indexa-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Tráfego Total</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTraffic.toLocaleString()}</div>
            <p className="text-xs text-purple-600">visitantes/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Buscar Prédios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, endereço ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Buildings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Lista de Prédios</CardTitle>
          <CardDescription className="text-gray-600">
            {filteredBuildings.length} prédios encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBuildings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {buildings.length === 0 ? (
                  <div>
                    <p className="text-lg font-medium mb-2">Nenhum prédio encontrado</p>
                    <p className="text-sm text-gray-400">
                      As políticas RLS foram corrigidas com sucesso. 
                      {userProfile?.email === 'jefersonstilver@gmail.com' ? 
                        ' Como super admin, você pode adicionar novos prédios.' :
                        ' Contate o administrador para adicionar prédios.'
                      }
                    </p>
                  </div>
                ) : (
                  <p>Nenhum prédio corresponde à busca "{searchTerm}"</p>
                )}
              </div>
            ) : (
              filteredBuildings.map((building) => {
                const statusInfo = getStatusBadge(building.status);
                
                return (
                  <div key={building.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-indexa-purple" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{building.nome}</h3>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                          {building.venue_type && (
                            <Badge variant="outline" className="text-xs">
                              {building.venue_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 mb-2">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600">{building.endereco}, {building.bairro}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          {building.monthly_traffic && (
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-gray-500">{building.monthly_traffic.toLocaleString()} visitantes/mês</span>
                            </div>
                          )}
                          {building.latitude && building.longitude && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-gray-500">Geolocalizado</span>
                            </div>
                          )}
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
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver no Mapa
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

export default BuildingsPage;
