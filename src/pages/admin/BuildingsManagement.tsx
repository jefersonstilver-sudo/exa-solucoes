
import React, { useState, useEffect } from 'react';
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
  Database,
  CheckCircle,
  MapPin,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  status: string;
  location_type: string;
  latitude: number | null;
  longitude: number | null;
  monthly_traffic: number | null;
  created_at: string;
}

const BuildingsManagement = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      console.log('🏢 Buscando todos os prédios...');
      
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar prédios:', error);
        toast.error('Erro ao carregar prédios');
        return;
      }

      console.log('✅ Prédios carregados:', data?.length, data);
      setBuildings(data || []);
      toast.success(`${data?.length || 0} prédios carregados com sucesso`);
    } catch (error) {
      console.error('💥 Erro crítico:', error);
      toast.error('Erro crítico ao carregar prédios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <Activity className="h-3 w-3 mr-1" />
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

  const getLocationTypeBadge = (locationType: string) => {
    const types: Record<string, { label: string; color: string }> = {
      residential: { label: 'Residencial', color: 'bg-blue-500/20 text-blue-600' },
      commercial: { label: 'Comercial', color: 'bg-purple-500/20 text-purple-600' },
      mixed: { label: 'Misto', color: 'bg-orange-500/20 text-orange-600' }
    };

    const type = types[locationType] || { label: locationType, color: 'bg-gray-500/20 text-gray-600' };
    
    return (
      <Badge className={type.color}>
        {type.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const filteredBuildings = buildings.filter(building =>
    building.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.bairro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: buildings.length,
    active: buildings.filter(b => b.status === 'ativo').length,
    withCoordinates: buildings.filter(b => b.latitude && b.longitude).length,
    residential: buildings.filter(b => b.location_type === 'residential').length,
    commercial: buildings.filter(b => b.location_type === 'commercial').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-indexa-purple" />
            Gerenciamento de Prédios
          </h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <Database className="h-4 w-4 mr-2 text-indexa-purple" />
            Conectado ao Supabase • {stats.total} prédios cadastrados
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={fetchBuildings} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-indexa-purple hover:bg-indexa-purple-dark">
            <Plus className="h-4 w-4 mr-2" />
            Novo Prédio
          </Button>
        </div>
      </div>

      {/* Status da conexão */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Conectado ao Supabase com Sucesso!</h3>
              <p className="text-green-700 text-sm">
                {stats.total} prédios carregados: {stats.active} ativos, {stats.withCoordinates} com coordenadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prédios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com GPS</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.withCoordinates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Residenciais</CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.residential}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comerciais</CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.commercial}</div>
          </CardContent>
        </Card>
      </div>

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

      {/* Tabela de prédios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prédios ({filteredBuildings.length})</CardTitle>
          <CardDescription>
            Prédios cadastrados no sistema INDEXA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-indexa-purple" />
              <span className="ml-2">Carregando prédios...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tráfego Mensal</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuildings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {buildings.length === 0 ? 'Nenhum prédio encontrado' : 'Nenhum prédio corresponde à busca'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBuildings.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indexa-purple/10 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-indexa-purple" />
                          </div>
                          <span className="font-medium">{building.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={building.endereco}>
                          {building.endereco}
                        </div>
                      </TableCell>
                      <TableCell>{building.bairro}</TableCell>
                      <TableCell>
                        {getLocationTypeBadge(building.location_type)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(building.status)}
                      </TableCell>
                      <TableCell>
                        {building.monthly_traffic ? building.monthly_traffic.toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(building.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingsManagement;
