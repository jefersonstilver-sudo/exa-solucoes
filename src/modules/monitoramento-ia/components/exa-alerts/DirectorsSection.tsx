import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DirectorCard } from './DirectorCard';
import { AddDirectorDialog } from './AddDirectorDialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Director {
  id: string;
  nome: string;
  telefone: string;
  departamento: string | null;
  nivel_acesso: 'basico' | 'gerente' | 'admin';
  ativo: boolean;
  pode_usar_ia: boolean;
}

export const DirectorsSection = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);

  const loadDirectors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDirectors((data as Director[]) || []);
    } catch (error: any) {
      console.error('Error loading directors:', error);
      toast.error('Erro ao carregar diretores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectors();
  }, []);

  const handleEdit = (director: Director) => {
    setSelectedDirector(director);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este diretor?')) return;

    try {
      const { error } = await supabase
        .from('exa_alerts_directors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Diretor removido com sucesso!');
      loadDirectors();
    } catch (error: any) {
      console.error('Error deleting director:', error);
      toast.error('Erro ao remover diretor');
    }
  };

  const handleToggleStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('exa_alerts_directors')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Diretor ${ativo ? 'ativado' : 'desativado'} com sucesso!`);
      loadDirectors();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleAddNew = () => {
    setSelectedDirector(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDirector(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Diretores Autorizados</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie os números de WhatsApp que recebem alertas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDirectors}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleAddNew}
            className="bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Diretor
          </Button>
        </div>
      </div>

      {/* Directors Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9C1E1E]" />
          <p className="mt-4 text-gray-600">Carregando diretores...</p>
        </div>
      ) : directors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-600 mb-4">Nenhum diretor cadastrado</p>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Diretor
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {directors.map((director, index) => (
            <motion.div
              key={director.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <DirectorCard
                director={director}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dialog */}
      <AddDirectorDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onSuccess={loadDirectors}
        director={selectedDirector}
      />
    </div>
  );
};
