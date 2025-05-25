
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  Settings,
  Users,
  DollarSign,
  Monitor,
  TrendingUp,
  MapPin,
  Camera
} from 'lucide-react';
import { useBuildingsData } from '@/hooks/useBuildingsData';
import BuildingFormDialog from '@/components/admin/buildings/BuildingFormDialog';
import BuildingDetailsDialog from '@/components/admin/buildings/BuildingDetailsDialog';
import BuildingImageGallery from '@/components/admin/buildings/BuildingImageGallery';
import BuildingFilters from '@/components/admin/buildings/BuildingFilters';

const BuildingsManagement = () => {
  const { buildings, stats, loading, refetch } = useBuildingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    bairro: '',
    padrao_publico: ''
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            Ativo
          </Badge>
        );
      case 'inativo':
        return (
          <Badge variant="secondary">
            Inativo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getPadraoPublicoBadge = (padrao: string) => {
    const styles = {
      alto: 'bg-purple-500/20 text-purple-600',
      medio: 'bg-blue-500/20 text-blue-600',
      normal: 'bg-gray-500/20 text-gray-600'
    };
    
    return (
      <Badge className={styles[padrao as keyof typeof styles] || styles.normal}>
        {padrao.charAt(0).toUpperCase() + padrao.slice(1)}
      </Badge>
    );
  };

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || building.status === filters.status;
    const matchesBairro = !filters.bairro || building.bairro === filters.bairro;
    const matchesPadrao = !filters.padrao_publico || building.padrao_publico === filters.padrao_publico;
    
    return matchesSearch && matchesStatus && matchesBairro && matchesPadrao;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
        <span className="ml-2 text-indexa-purple">Carregando prédios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-indexa-purple" />
            Gerenciamento Completo de Prédios
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema integrado com cálculos automáticos e galeria de imagens
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            className="bg-indexa-purple hover:bg-indexa-purple-dark"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Prédio
          </Button>
        </div>
      </div>

      {/* Estatísticas Avançadas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prédios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalUnits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Público Total</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalUnits * 3}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatPrice(stats.averagePrice)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telas Ativas</CardTitle>
            <Monitor className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {buildings.reduce((sum, b) => sum + b.quantidade_telas, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <BuildingFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        buildings={buildings}
      />

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-indexa-purple" />
            Buscar Prédios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome, endereço ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Tabela Melhorada */}
      <Card>
        <CardHeader>
          <CardTitle>Prédios Cadastrados ({filteredBuildings.length})</CardTitle>
          <CardDescription>
            Gestão completa com informações detalhadas e ações em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prédio</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Telas</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indexa-purple/10 rounded-lg flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-indexa-purple" />
                      </div>
                      <div>
                        <div className="font-medium">{building.nome}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          {building.image_urls?.length || 0} fotos
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{building.bairro}</span>
                    </div>
                    <div className="text-xs text-gray-500 max-w-[200px] truncate">
                      {building.endereco}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold">{building.numero_unidades}</div>
                      <div className="text-xs text-gray-500">apartamentos</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold text-purple-600">{building.publico_estimado}</div>
                      <div className="text-xs text-gray-500">pessoas</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{building.quantidade_telas}</div>
                      <div className="text-xs text-gray-500">painéis</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600">
                      {formatPrice(building.preco_base)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPadraoPublicoBadge(building.padrao_publico)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(building.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBuilding(building);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBuilding(building);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBuilding(building);
                          setIsImageGalleryOpen(true);
                        }}
                      >
                        <Camera className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BuildingFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        building={selectedBuilding}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedBuilding(null);
          refetch();
        }}
      />

      <BuildingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        building={selectedBuilding}
      />

      <BuildingImageGallery
        open={isImageGalleryOpen}
        onOpenChange={setIsImageGalleryOpen}
        building={selectedBuilding}
        onImagesUpdate={refetch}
      />
    </div>
  );
};

export default BuildingsManagement;
