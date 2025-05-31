import React, { useState, useEffect } from 'react';
import { Building2, User, MapPin, Phone, Mail, Calendar, Eye, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SindicoInteressado {
  id: string;
  nome_completo: string;
  nome_predio: string;
  endereco: string;
  numero_andares: number;
  numero_unidades: number;
  email: string;
  celular: string;
  observacoes?: string;
  status: string;
  data_contato?: string;
  created_at: string;
  updated_at: string;
}

const SindicosInteressados = () => {
  const [sindicos, setSindicos] = useState<SindicoInteressado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSindico, setSelectedSindico] = useState<SindicoInteressado | null>(null);

  useEffect(() => {
    fetchSindicos();
  }, []);

  const fetchSindicos = async () => {
    try {
      const { data, error } = await supabase
        .from('sindicos_interessados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar síndicos:', error);
        toast.error('Erro ao carregar síndicos interessados');
      } else {
        setSindicos(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sindicos_interessados')
        .update({ 
          status: newStatus,
          data_contato: newStatus === 'contatado' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
      } else {
        toast.success('Status atualizado com sucesso');
        fetchSindicos();
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Nome Completo',
      'Nome do Prédio', 
      'Endereço',
      'Número de Andares',
      'Número de Unidades',
      'Email',
      'Celular',
      'Status',
      'Data de Cadastro'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredSindicos.map(sindico => [
        sindico.nome_completo,
        sindico.nome_predio,
        `"${sindico.endereco}"`,
        sindico.numero_andares,
        sindico.numero_unidades,
        sindico.email,
        sindico.celular,
        sindico.status,
        format(new Date(sindico.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sindicos_interessados_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const filteredSindicos = sindicos.filter(sindico => {
    const matchesSearch = 
      sindico.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sindico.nome_predio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sindico.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sindico.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sindico.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badgeProps = {
      'novo': { variant: 'default' as const, className: 'bg-blue-500 text-white' },
      'contatado': { variant: 'secondary' as const, className: '' },
      'interessado': { variant: 'default' as const, className: 'bg-green-500 text-white' },
      'nao_interessado': { variant: 'destructive' as const, className: '' },
      'instalado': { variant: 'default' as const, className: 'bg-emerald-500 text-white' }
    };

    const labels = {
      'novo': 'Novo',
      'contatado': 'Contatado',
      'interessado': 'Interessado', 
      'nao_interessado': 'Não Interessado',
      'instalado': 'Instalado'
    };

    const props = badgeProps[status as keyof typeof badgeProps] || { variant: 'default' as const, className: '' };
    const label = labels[status as keyof typeof labels] || status;

    return (
      <Badge variant={props.variant} className={props.className}>
        {label}
      </Badge>
    );
  };

  const stats = {
    total: sindicos.length,
    novos: sindicos.filter(s => s.status === 'novo').length,
    contatados: sindicos.filter(s => s.status === 'contatado').length,
    interessados: sindicos.filter(s => s.status === 'interessado').length,
    instalados: sindicos.filter(s => s.status === 'instalado').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Carregando síndicos interessados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Síndicos Interessados</h1>
          <p className="text-gray-600">Gerencie os síndicos que demonstraram interesse no projeto</p>
        </div>
        
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Novos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.novos}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Contatados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.contatados}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Interessados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.interessados}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Instalados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.instalados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, prédio, endereço ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="interessado">Interessado</SelectItem>
                  <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                  <SelectItem value="instalado">Instalado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Síndico</TableHead>
                <TableHead>Prédio</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSindicos.map((sindico) => (
                <TableRow key={sindico.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">{sindico.nome_completo}</div>
                        <div className="text-sm text-gray-500">{sindico.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{sindico.nome_predio}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{sindico.endereco}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{sindico.numero_unidades}</div>
                      <div className="text-xs text-gray-500">{sindico.numero_andares} andares</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{sindico.celular}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Select
                      value={sindico.status}
                      onValueChange={(value) => updateStatus(sindico.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="contatado">Contatado</SelectItem>
                        <SelectItem value="interessado">Interessado</SelectItem>
                        <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                        <SelectItem value="instalado">Instalado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(sindico.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedSindico(sindico)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Síndico Interessado</DialogTitle>
                        </DialogHeader>
                        
                        {selectedSindico && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Nome Completo</label>
                                <p className="text-sm">{selectedSindico.nome_completo}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Nome do Prédio</label>
                                <p className="text-sm">{selectedSindico.nome_predio}</p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium text-gray-600">Endereço</label>
                              <p className="text-sm">{selectedSindico.endereco}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Número de Andares</label>
                                <p className="text-sm">{selectedSindico.numero_andares}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Número de Unidades</label>
                                <p className="text-sm">{selectedSindico.numero_unidades}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Email</label>
                                <p className="text-sm">{selectedSindico.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Celular</label>
                                <p className="text-sm">{selectedSindico.celular}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-600">Status</label>
                                <div className="mt-1">
                                  {getStatusBadge(selectedSindico.status)}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-600">Data de Cadastro</label>
                                <p className="text-sm">
                                  {format(new Date(selectedSindico.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            
                            {selectedSindico.data_contato && (
                              <div>
                                <label className="text-sm font-medium text-gray-600">Data do Contato</label>
                                <p className="text-sm">
                                  {format(new Date(selectedSindico.data_contato), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSindicos.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum síndico encontrado com os filtros aplicados'
                  : 'Nenhum síndico interessado cadastrado ainda'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SindicosInteressados;
