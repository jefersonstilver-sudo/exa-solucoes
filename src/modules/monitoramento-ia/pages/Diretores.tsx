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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Diretores Autorizados
            </h1>
            <p className="text-[#A0A0A0] mt-1">
              Gerenciar notificações via WhatsApp para diretores
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Diretor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-4">
          <p className="text-sm text-[#A0A0A0]">Total de Diretores</p>
          <p className="text-2xl font-bold text-white">{directors.length}</p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-4">
          <p className="text-sm text-[#A0A0A0]">Ativos</p>
          <p className="text-2xl font-bold text-green-500">
            {directors.filter(d => d.is_active).length}
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-4">
          <p className="text-sm text-[#A0A0A0]">Inativos</p>
          <p className="text-2xl font-bold text-[#6B7280]">
            {directors.filter(d => !d.is_active).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#6B7280]"
        />
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A2A2A] hover:bg-[#0A0A0A]/50">
              <TableHead className="text-[#A0A0A0]">Nome</TableHead>
              <TableHead className="text-[#A0A0A0]">Telefone</TableHead>
              <TableHead className="text-[#A0A0A0]">Status</TableHead>
              <TableHead className="text-[#A0A0A0]">Criado em</TableHead>
              <TableHead className="text-right text-[#A0A0A0]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDirectors.map((director) => (
              <TableRow key={director.id} className="border-[#2A2A2A] hover:bg-[#0A0A0A]/30">
                <TableCell className="font-medium text-white">{director.name}</TableCell>
                <TableCell className="text-[#A0A0A0]">{director.phone}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      director.is_active
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[#6B7280]/20 text-[#6B7280] border border-[#6B7280]/30'
                    }`}
                  >
                    {director.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </TableCell>
                <TableCell className="text-[#A0A0A0]">
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
                    className="border-[#2A2A2A] text-white hover:bg-[#9C1E1E] hover:border-[#9C1E1E]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDeleteModal(director.id)}
                    className="border-[#2A2A2A] text-red-400 hover:bg-red-500/20 hover:border-red-500"
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
          <div key={director.id} className="border border-[#2A2A2A] bg-[#1A1A1A] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{director.name}</h3>
                <p className="text-sm text-[#A0A0A0]">{director.phone}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  director.is_active
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-[#6B7280]/20 text-[#6B7280] border border-[#6B7280]/30'
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
                  className="border-[#2A2A2A] text-white hover:bg-[#9C1E1E] hover:border-[#9C1E1E]"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openDeleteModal(director.id)}
                  className="border-[#2A2A2A] text-red-400 hover:bg-red-500/20 hover:border-red-500"
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
            className="border-[#2A2A2A] text-white hover:bg-[#9C1E1E] hover:border-[#9C1E1E]"
          >
            Anterior
          </Button>
          <span className="text-sm text-[#A0A0A0]">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="border-[#2A2A2A] text-white hover:bg-[#9C1E1E] hover:border-[#9C1E1E]"
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
