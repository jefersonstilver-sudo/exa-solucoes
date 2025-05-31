
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SindicoInteressado, SindicosStats } from '@/components/admin/sindicos-interessados/types';
import SindicosPageHeader from '@/components/admin/sindicos-interessados/SindicosPageHeader';
import SindicosStatsCards from '@/components/admin/sindicos-interessados/SindicosStatsCards';
import SindicosFilters from '@/components/admin/sindicos-interessados/SindicosFilters';
import SindicosTable from '@/components/admin/sindicos-interessados/SindicosTable';
import SindicoDetailsDialog from '@/components/admin/sindicos-interessados/SindicoDetailsDialog';

const SindicosInteressados = () => {
  const [sindicos, setSindicos] = useState<SindicoInteressado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSindico, setSelectedSindico] = useState<SindicoInteressado | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const stats: SindicosStats = {
    total: sindicos.length,
    novos: sindicos.filter(s => s.status === 'novo').length,
    contatados: sindicos.filter(s => s.status === 'contatado').length,
    interessados: sindicos.filter(s => s.status === 'interessado').length,
    instalados: sindicos.filter(s => s.status === 'instalado').length
  };

  const handleViewDetails = (sindico: SindicoInteressado) => {
    setSelectedSindico(sindico);
    setDialogOpen(true);
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
      <SindicosPageHeader onExportCSV={exportToCSV} />
      <SindicosStatsCards stats={stats} />
      <SindicosFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      <SindicosTable
        sindicos={filteredSindicos}
        onUpdateStatus={updateStatus}
        onViewDetails={handleViewDetails}
      />
      <SindicoDetailsDialog
        sindico={selectedSindico}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default SindicosInteressados;
