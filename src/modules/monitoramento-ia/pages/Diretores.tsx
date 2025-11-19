import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Search, Plus, Trash2, Edit } from 'lucide-react';

interface NotificationPreferences {
  critical?: boolean;
  offline?: boolean;
  temperature?: boolean;
  daily_summary?: boolean;
  [key: string]: boolean | undefined;
}

interface Director {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  notify_preferences?: NotificationPreferences | null;
  created_at: string;
}

export const DiretoresPage = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [deleteDirectorId, setDeleteDirectorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ 
    name: string; 
    phone: string; 
    is_active: boolean;
    notify_preferences: NotificationPreferences;
  }>({ 
    name: '', 
    phone: '', 
    is_active: true,
    notify_preferences: {
      critical: true,
      offline: false,
      temperature: false,
      daily_summary: false,
    }
  });
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchDirectors();
  }, []);

  useEffect(() => {
    filterDirectors();
  }, [searchTerm, directors]);

  const fetchDirectors = async () => {
    const { data, error } = await supabase
      .from('directors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar diretores', variant: 'destructive' });
      return;
    }

    if (!error && data) {
      setDirectors(data.map(d => ({
        ...d,
        notify_preferences: d.notify_preferences as NotificationPreferences | null
      })));
    }
  };

  const filterDirectors = () => {
    if (!searchTerm) {
      setFilteredDirectors(directors);
      return;
    }

    const filtered = directors.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
    );
    setFilteredDirectors(filtered);
    setCurrentPage(1);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('55')) {
      return `+${numbers}`;
    }
    return numbers ? `+55${numbers}` : '';
  };

  const openCreateModal = () => {
    setEditingDirector(null);
    setFormData({ 
      name: '', 
      phone: '', 
      is_active: true,
      notify_preferences: {
        critical: true,
        offline: false,
        temperature: false,
        daily_summary: false,
      }
    });
    setIsModalOpen(true);
  };

  const openEditModal = (director: Director) => {
    setEditingDirector(director);
    setFormData({
      name: director.name,
      phone: director.phone,
      is_active: director.is_active,
      notify_preferences: director.notify_preferences || {
        critical: true,
        offline: false,
        temperature: false,
        daily_summary: false,
      }
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const formattedPhone = formatPhone(formData.phone);
    setLoading(true);

    try {
      if (editingDirector) {
        const { error } = await supabase
          .from('directors')
          .update({ 
            name: formData.name, 
            phone: formattedPhone, 
            is_active: formData.is_active,
            notify_preferences: formData.notify_preferences as any
          })
          .eq('id', editingDirector.id);

        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Telefone já cadastrado', variant: 'destructive' });
          } else {
            toast({ title: 'Erro ao atualizar diretor', variant: 'destructive' });
          }
          setLoading(false);
          return;
        }

        toast({ title: 'Diretor atualizado com sucesso' });
      } else {
        const { error } = await supabase
          .from('directors')
          .insert([{ 
            name: formData.name, 
            phone: formattedPhone, 
            is_active: formData.is_active,
            notify_preferences: formData.notify_preferences as any
          }]);

        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Telefone já cadastrado', variant: 'destructive' });
          } else {
            toast({ title: 'Erro ao criar diretor', variant: 'destructive' });
          }
          setLoading(false);
          return;
        }

        toast({ title: 'Diretor criado com sucesso' });
      }

      setIsModalOpen(false);
      fetchDirectors();
    } catch (error) {
      toast({ title: 'Erro inesperado', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('directors')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
      return;
    }

    fetchDirectors();
  };

  const openDeleteModal = (id: string) => {
    setDeleteDirectorId(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDirectorId) return;

    const { error } = await supabase.from('directors').delete().eq('id', deleteDirectorId);

    if (error) {
      toast({ title: 'Erro ao excluir diretor', variant: 'destructive' });
      return;
    }

    toast({ title: 'Diretor excluído com sucesso' });
    setIsDeleteModalOpen(false);
    fetchDirectors();
  };

  const paginatedDirectors = filteredDirectors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDirectors.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-[#0A0A0A]">
          Diretores Autorizados
        </h1>
        <Button
          onClick={openCreateModal}
          className="bg-[#FFD000] hover:bg-[#FFD000]/90 text-[#0A0A0A] font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Diretor
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDirectors.map((director) => (
              <TableRow key={director.id}>
                <TableCell className="font-medium">{director.name}</TableCell>
                <TableCell>{director.phone}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      director.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {director.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(director.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Switch
                    checked={director.is_active}
                    onCheckedChange={() => toggleActive(director.id, director.is_active)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(director)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openDeleteModal(director.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="lg:hidden space-y-4">
        {paginatedDirectors.map((director) => (
          <div key={director.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-[#0A0A0A]">{director.name}</h3>
                <p className="text-sm text-gray-600">{director.phone}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  director.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {director.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Criado em {new Date(director.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <Switch
                checked={director.is_active}
                onCheckedChange={() => toggleActive(director.id, director.is_active)}
              />
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(director)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openDeleteModal(director.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Próximo
          </Button>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDirector ? 'Editar Diretor' : 'Novo Diretor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone *</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+5511999999999"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <label className="text-sm font-medium">Ativo</label>
            </div>

            {/* WhatsApp Notifications Section */}
            <div className="space-y-3 pt-4 border-t">
              <label className="text-sm font-medium block">Notificações WhatsApp</label>
              <div className="space-y-2">
                {[
                  { key: 'critical', label: 'Alertas Críticos' },
                  { key: 'offline', label: 'Painéis Offline > 30min' },
                  { key: 'temperature', label: 'Temperatura Alta' },
                  { key: 'daily_summary', label: 'Resumo Diário' },
                ].map(option => (
                  <div key={option.key} className="flex items-center gap-2">
                    <Switch
                      checked={formData.notify_preferences?.[option.key] ?? false}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          notify_preferences: {
                            ...formData.notify_preferences,
                            [option.key]: checked
                          }
                        })
                      }
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#FFD000] hover:bg-[#FFD000]/90 text-[#0A0A0A]"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Tem certeza que deseja excluir este diretor?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
