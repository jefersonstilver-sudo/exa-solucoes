import React, { useState, useEffect } from 'react';
import { 
  ImageIcon, 
  Search, 
  PlusCircle, 
  RefreshCw, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  Building,
  ChevronDown,
  AlertCircle
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

interface Panel {
  id: string;
  code: string;
  status: string;
  resolucao?: string;
  modo?: string;
  ultima_sync?: string;
  building_id: string;
  building?: {
    nome: string;
    endereco: string;
    bairro: string;
  };
}

interface Building {
  id: string;
  nome: string;
  endereco: string;
}

const PanelsPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [panels, setPanels] = useState<Panel[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    building_id: '',
    status: 'offline',
    resolucao: '',
    modo: '',
  });

  useEffect(() => {
    fetchPanels();
    fetchBuildings();
  }, []);
  
  const fetchPanels = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('painels')
        .select(`
          *,
          buildings (
            id,
            nome,
            endereco,
            bairro
          )
        `)
        .order('code', { ascending: true });
      
      if (error) throw error;
      
      console.log('Panels loaded:', data);
      setPanels(data || []);
    } catch (error) {
      console.error('Error loading panels:', error);
      toast.error('Erro ao carregar painéis');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco')
        .eq('status', 'ativo')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      
      setBuildings(data || []);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (value: string | null) => {
    setFilterStatus(value);
  };
  
  const filteredPanels = panels.filter(panel => {
    // Apply status filter
    if (filterStatus && panel.status !== filterStatus) {
      return false;
    }
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        panel.code.toLowerCase().includes(searchLower) ||
        (panel.building?.nome && panel.building.nome.toLowerCase().includes(searchLower)) ||
        (panel.building?.endereco && panel.building.endereco.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      code: '',
      building_id: '',
      status: 'offline',
      resolucao: '',
      modo: '',
    });
  };
  
  const handleAddPanel = async () => {
    try {
      // Validate required fields
      if (!formData.code || !formData.building_id) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      // Check if code already exists
      const { data: existingPanel, error: checkError } = await supabase
        .from('painels')
        .select('id')
        .eq('code', formData.code)
        .single();
        
      if (existingPanel) {
        toast.error('Já existe um painel com este código');
        return;
      }
      
      const { data, error } = await supabase
        .from('painels')
        .insert([formData])
        .select();
        
      if (error) throw error;
      
      toast.success('Painel adicionado com sucesso');
      setShowAddDialog(false);
      resetForm();
      fetchPanels();
    } catch (error) {
      console.error('Error adding panel:', error);
      toast.error('Erro ao adicionar painel');
    }
  };
  
  const handleEditClick = (panel: Panel) => {
    setSelectedPanel(panel);
    setFormData({
      code: panel.code || '',
      building_id: panel.building_id || '',
      status: panel.status || 'offline',
      resolucao: panel.resolucao || '',
      modo: panel.modo || '',
    });
    setShowEditDialog(true);
  };
  
  const handleUpdatePanel = async () => {
    if (!selectedPanel) return;
    
    try {
      // Validate required fields
      if (!formData.code || !formData.building_id) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }
      
      // If code changed, check if new code already exists
      if (formData.code !== selectedPanel.code) {
        const { data: existingPanel, error: checkError } = await supabase
          .from('painels')
          .select('id')
          .eq('code', formData.code)
          .single();
          
        if (existingPanel) {
          toast.error('Já existe um painel com este código');
          return;
        }
      }
      
      const { error } = await supabase
        .from('painels')
        .update(formData)
        .eq('id', selectedPanel.id);
        
      if (error) throw error;
      
      toast.success('Painel atualizado com sucesso');
      setShowEditDialog(false);
      resetForm();
      fetchPanels();
    } catch (error) {
      console.error('Error updating panel:', error);
      toast.error('Erro ao atualizar painel');
    }
  };
  
  const handleDeleteClick = (panel: Panel) => {
    setSelectedPanel(panel);
    setShowDeleteDialog(true);
  };
  
  const handleDeletePanel = async () => {
    if (!selectedPanel) return;
    
    try {
      // Check if panel is in use by campaigns
      const { data: campaigns, error: checkError } = await supabase
        .from('campanhas')
        .select('id')
        .eq('painel_id', selectedPanel.id)
        .limit(1);
        
      if (campaigns && campaigns.length > 0) {
        toast.error('Este painel está sendo usado em campanhas ativas');
        setShowDeleteDialog(false);
        return;
      }
      
      const { error } = await supabase
        .from('painels')
        .delete()
        .eq('id', selectedPanel.id);
        
      if (error) throw error;
      
      toast.success('Painel removido com sucesso');
      setShowDeleteDialog(false);
      fetchPanels();
    } catch (error) {
      console.error('Error deleting panel:', error);
      toast.error('Erro ao remover painel');
    }
  };
  
  const getPanelStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Manutenção</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const formatLastSync = (date?: string) => {
    if (!date) return 'Nunca';
    
    const syncDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`;
    } else {
      return `${diffDays} d atrás`;
    }
  };

  return (
    <AdminLayout title="Gestão de Painéis">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <ImageIcon className="mr-2 h-6 w-6 text-indexa-purple" />
              Gestão de Painéis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie todos os painéis cadastrados no sistema
            </p>
          </motion.div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPanels} 
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
              Adicionar Painel
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar por código ou prédio..." 
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
              onValueChange={(value) => handleFilterChange(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Lista de Painéis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
              </div>
            ) : filteredPanels.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Prédio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Sincronização</TableHead>
                      <TableHead>Resolução</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPanels.map((panel) => (
                      <TableRow 
                        key={panel.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell 
                          className="font-medium"
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          {panel.code}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          <div className="flex flex-col">
                            <span>{panel.building?.nome || 'N/A'}</span>
                            <span className="text-xs text-gray-500">
                              {panel.building?.bairro || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          {getPanelStatusBadge(panel.status)}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          {formatLastSync(panel.ultima_sync)}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          {panel.resolucao || 'N/A'}
                        </TableCell>
                        <TableCell
                          onClick={() => navigate(`/admin/paineis/${panel.id}`)}
                        >
                          {panel.modo || 'Normal'}
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
                              <DropdownMenuItem onClick={() => navigate(`/admin/paineis/${panel.id}`)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditClick(panel)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(panel)}
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
                Nenhum painel encontrado com os filtros atuais
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Panel Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Painel</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo painel ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="code" className="mb-1">Código do Painel*</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="Ex: PAINEL-001"
              />
            </div>
            <div>
              <Label htmlFor="building_id" className="mb-1">Prédio*</Label>
              <Select
                value={formData.building_id}
                onValueChange={(value) => handleSelectChange('building_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o prédio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.nome} - {building.endereco}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resolucao" className="mb-1">Resolução</Label>
              <Input
                id="resolucao"
                name="resolucao"
                value={formData.resolucao}
                onChange={handleFormChange}
                placeholder="Ex: 1920x1080"
              />
            </div>
            <div>
              <Label htmlFor="modo" className="mb-1">Modo de Exibição</Label>
              <Input
                id="modo"
                name="modo"
                value={formData.modo}
                onChange={handleFormChange}
                placeholder="Ex: Fullscreen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddPanel}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Panel Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Painel</DialogTitle>
            <DialogDescription>
              Edite as informações do painel.
            </DialogDescription>
          </DialogHeader>
          {/* Same form fields as Add Panel Dialog */}
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-code" className="mb-1">Código do Painel*</Label>
              <Input
                id="edit-code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="Ex: PAINEL-001"
              />
            </div>
            <div>
              <Label htmlFor="building_id" className="mb-1">Prédio*</Label>
              <Select
                value={formData.building_id}
                onValueChange={(value) => handleSelectChange('building_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o prédio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.nome} - {building.endereco}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resolucao" className="mb-1">Resolução</Label>
              <Input
                id="resolucao"
                name="resolucao"
                value={formData.resolucao}
                onChange={handleFormChange}
                placeholder="Ex: 1920x1080"
              />
            </div>
            <div>
              <Label htmlFor="modo" className="mb-1">Modo de Exibição</Label>
              <Input
                id="modo"
                name="modo"
                value={formData.modo}
                onChange={handleFormChange}
                placeholder="Ex: Fullscreen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePanel}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Panel Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja remover o painel "{selectedPanel?.code}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeletePanel}>Remover Painel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PanelsPage;
