import React, { useState, useEffect } from 'react';
import { 
  Building as BuildingIcon, 
  Search, 
  PlusCircle, 
  RefreshCw, 
  Filter,
  Map,
  MoreVertical,
  Edit,
  Trash2,
  ImageIcon,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  venue_type: string;
  status: string;
  monthly_traffic?: number;
  audience_profile?: string[];
  imageurl?: string;
  painels_count?: number;
}

const BuildingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    venue_type: 'residential',
    status: 'ativo',
    latitude: '',
    longitude: '',
    monthly_traffic: '',
    imageurl: '',
  });

  useEffect(() => {
    fetchBuildings();
  }, []);
  
  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      
      // Get buildings with panel count
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          *,
          painels:painels(count)
        `);
      
      if (error) throw error;
      
      // Process the data to include panel count
      const processedData = data.map(building => ({
        ...building,
        painels_count: building.painels ? building.painels.length : 0
      }));
      
      setBuildings(processedData);
      console.log('Buildings loaded:', processedData);
    } catch (error) {
      console.error('Error loading buildings:', error);
      toast.error('Erro ao carregar prédios');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (type: 'status' | 'type', value: string | null) => {
    if (type === 'status') {
      setFilterStatus(value);
    } else {
      setFilterType(value);
    }
  };
  
  const filteredBuildings = buildings.filter(building => {
    // Apply status filter
    if (filterStatus && building.status !== filterStatus) {
      return false;
    }
    
    // Apply type filter
    if (filterType && building.venue_type !== filterType) {
      return false;
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        building.nome.toLowerCase().includes(searchLower) ||
        building.endereco.toLowerCase().includes(searchLower) ||
        building.bairro.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetForm = () => {
    setFormData({
      nome: '',
      endereco: '',
      bairro: '',
      venue_type: 'residential',
      status: 'ativo',
      latitude: '',
      longitude: '',
      monthly_traffic: '',
      imageurl: '',
    });
  };
  
  const handleAddBuilding = async () => {
    try {
      // Validate required fields
      if (!formData.nome || !formData.endereco || !formData.bairro) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      // Convert numeric fields
      const buildingData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        monthly_traffic: formData.monthly_traffic ? parseInt(formData.monthly_traffic) : null,
      };
      
      const { data, error } = await supabase
        .from('buildings')
        .insert([buildingData])
        .select();
        
      if (error) throw error;
      
      toast.success('Prédio adicionado com sucesso');
      setShowAddDialog(false);
      resetForm();
      fetchBuildings();
    } catch (error) {
      console.error('Error adding building:', error);
      toast.error('Erro ao adicionar prédio');
    }
  };
  
  const handleEditClick = (building: Building) => {
    setSelectedBuilding(building);
    setFormData({
      nome: building.nome || '',
      endereco: building.endereco || '',
      bairro: building.bairro || '',
      venue_type: building.venue_type || 'residential',
      status: building.status || 'ativo',
      latitude: building.latitude ? building.latitude.toString() : '',
      longitude: building.longitude ? building.longitude.toString() : '',
      monthly_traffic: building.monthly_traffic ? building.monthly_traffic.toString() : '',
      imageurl: building.imageurl || '',
    });
    setShowEditDialog(true);
  };
  
  const handleUpdateBuilding = async () => {
    if (!selectedBuilding) return;
    
    try {
      // Validate required fields
      if (!formData.nome || !formData.endereco || !formData.bairro) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      // Convert numeric fields
      const buildingData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        monthly_traffic: formData.monthly_traffic ? parseInt(formData.monthly_traffic) : null,
      };
      
      const { error } = await supabase
        .from('buildings')
        .update(buildingData)
        .eq('id', selectedBuilding.id);
        
      if (error) throw error;
      
      toast.success('Prédio atualizado com sucesso');
      setShowEditDialog(false);
      resetForm();
      fetchBuildings();
    } catch (error) {
      console.error('Error updating building:', error);
      toast.error('Erro ao atualizar prédio');
    }
  };
  
  const handleDeleteClick = (building: Building) => {
    setSelectedBuilding(building);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteBuilding = async () => {
    if (!selectedBuilding) return;
    
    try {
      // First check if the building has panels
      if (selectedBuilding.painels_count && selectedBuilding.painels_count > 0) {
        toast.error('Este prédio possui painéis associados. Remova os painéis primeiro.');
        setShowDeleteDialog(false);
        return;
      }
      
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', selectedBuilding.id);
        
      if (error) throw error;
      
      toast.success('Prédio removido com sucesso');
      setShowDeleteDialog(false);
      fetchBuildings();
    } catch (error) {
      console.error('Error deleting building:', error);
      toast.error('Erro ao remover prédio');
    }
  };
  
  const formatVenueType = (type: string) => {
    switch (type) {
      case 'residential':
        return 'Residencial';
      case 'commercial':
        return 'Comercial';
      case 'mixed':
        return 'Misto';
      default:
        return type;
    }
  };

  return (
    <AdminLayout title="Gestão de Prédios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <BuildingIcon className="mr-2 h-6 w-6 text-indexa-purple" />
              Gestão de Prédios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os prédios cadastrados no sistema
            </p>
          </motion.div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBuildings} 
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Adicionar Prédio
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por nome ou endereço..." 
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="manutenção">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo de Local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="residential">Residencial</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/predios/mapa')}>
              <Map className="h-4 w-4 mr-1" />
              Ver Mapa
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de Prédios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
              </div>
            ) : filteredBuildings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Painéis</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuildings.map((building) => (
                      <TableRow key={building.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell 
                          className="font-medium"
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          {building.nome}
                        </TableCell>
                        <TableCell 
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          {building.endereco}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          {building.bairro}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          {formatVenueType(building.venue_type)}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          <Badge
                            variant="outline"
                            className={
                              building.status === 'ativo' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : building.status === 'inativo'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }
                          >
                            {building.status}
                          </Badge>
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/predios/${building.id}`)}
                        >
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1 text-gray-500" />
                            <span>{building.painels_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/admin/predios/${building.id}`)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(building)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(building)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum prédio encontrado com os filtros atuais
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Building Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Prédio</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo prédio ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome" className="mb-1">Nome do Prédio*</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleFormChange}
                  placeholder="Ex: Edifício Central Park"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="endereco" className="mb-1">Endereço*</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleFormChange}
                  placeholder="Ex: Av. Paulista, 1000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="bairro" className="mb-1">Bairro*</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleFormChange}
                  placeholder="Ex: Jardins"
                />
              </div>
              <div>
                <Label htmlFor="latitude" className="mb-1">Latitude</Label>
                <Input
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  placeholder="Ex: -23.550520"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="mb-1">Longitude</Label>
                <Input
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  placeholder="Ex: -46.633309"
                />
              </div>
              <div>
                <Label htmlFor="venue_type" className="mb-1">Tipo de Local</Label>
                <Select
                  value={formData.venue_type}
                  onValueChange={(value) => handleSelectChange('venue_type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="mixed">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="mb-1">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutenção">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthly_traffic" className="mb-1">Tráfego Mensal</Label>
                <Input
                  id="monthly_traffic"
                  name="monthly_traffic"
                  type="number"
                  value={formData.monthly_traffic}
                  onChange={handleFormChange}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label htmlFor="imageurl" className="mb-1">URL da Imagem</Label>
                <Input
                  id="imageurl"
                  name="imageurl"
                  value={formData.imageurl}
                  onChange={handleFormChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddBuilding}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Building Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Prédio</DialogTitle>
            <DialogDescription>
              Edite as informações do prédio.
            </DialogDescription>
          </DialogHeader>
          {/* Same form fields as Add Building Dialog */}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-nome" className="mb-1">Nome do Prédio*</Label>
                <Input
                  id="edit-nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleFormChange}
                  placeholder="Ex: Edifício Central Park"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-endereco" className="mb-1">Endereço*</Label>
                <Input
                  id="edit-endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleFormChange}
                  placeholder="Ex: Av. Paulista, 1000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-bairro" className="mb-1">Bairro*</Label>
                <Input
                  id="edit-bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleFormChange}
                  placeholder="Ex: Jardins"
                />
              </div>
              <div>
                <Label htmlFor="edit-latitude" className="mb-1">Latitude</Label>
                <Input
                  id="edit-latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  placeholder="Ex: -23.550520"
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude" className="mb-1">Longitude</Label>
                <Input
                  id="edit-longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  placeholder="Ex: -46.633309"
                />
              </div>
              <div>
                <Label htmlFor="edit-venue_type" className="mb-1">Tipo de Local</Label>
                <Select
                  value={formData.venue_type}
                  onValueChange={(value) => handleSelectChange('venue_type', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residencial</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="mixed">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status" className="mb-1">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutenção">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-monthly_traffic" className="mb-1">Tráfego Mensal</Label>
                <Input
                  id="edit-monthly_traffic"
                  name="monthly_traffic"
                  type="number"
                  value={formData.monthly_traffic}
                  onChange={handleFormChange}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <Label htmlFor="edit-imageurl" className="mb-1">URL da Imagem</Label>
                <Input
                  id="edit-imageurl"
                  name="imageurl"
                  value={formData.imageurl}
                  onChange={handleFormChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdateBuilding}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Building Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja remover o prédio "{selectedBuilding?.nome}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteBuilding}>Remover Prédio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default BuildingsPage;
