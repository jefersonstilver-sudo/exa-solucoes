
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
import { Loader2, Database, AlertCircle } from 'lucide-react';

const SindicosInteressados = () => {
  const [sindicos, setSindicos] = useState<SindicoInteressado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSindico, setSelectedSindico] = useState<SindicoInteressado | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSindicos();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('sindicos-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sindicos_interessados' 
        }, 
        () => {
          console.log('📡 Sindicos: Dados atualizados em tempo real');
          fetchSindicos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSindicos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Sindicos: Buscando dados...');
      
      const { data, error } = await supabase
        .from('sindicos_interessados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar síndicos:', error);
        setError('Erro ao carregar síndicos interessados: ' + error.message);
        toast.error('Erro ao carregar síndicos interessados');
      } else {
        console.log('✅ Síndicos carregados:', data?.length || 0);
        setSindicos(data || []);
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setError('Erro inesperado ao carregar dados');
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      console.log('🔄 Atualizando status do síndico:', id, 'para:', newStatus);
      
      const { error } = await supabase
        .from('sindicos_interessados')
        .update({ 
          status: newStatus,
          data_contato: newStatus === 'contatado' ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status: ' + error.message);
      } else {
        toast.success('Status atualizado com sucesso');
        fetchSindicos();
      }
    } catch (error) {
      console.error('❌ Erro:', error);
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
    
    toast.success('CSV exportado com sucesso!');
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
          <Loader2 className="animate-spin h-12 w-12 text-indexa-purple mx-auto mb-4" />
          <p className="text-gray-600">Carregando síndicos interessados...</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Database className="h-4 w-4 text-indexa-purple" />
            <span className="text-sm text-indexa-purple">Conectando ao Supabase...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erro de Conexão</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchSindicos}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
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
      
      {filteredSindicos.length === 0 && !loading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {sindicos.length === 0 ? 'Nenhum síndico cadastrado' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-gray-500">
            {sindicos.length === 0 
              ? 'Os síndicos interessados aparecerão aqui quando forem cadastrados no formulário.'
              : 'Tente ajustar os filtros de busca.'}
          </p>
        </div>
      ) : (
        <SindicosTable
          sindicos={filteredSindicos}
          onUpdateStatus={updateStatus}
          onViewDetails={handleViewDetails}
        />
      )}
      
      <SindicoDetailsDialog
        sindico={selectedSindico}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default SindicosInteressados;
