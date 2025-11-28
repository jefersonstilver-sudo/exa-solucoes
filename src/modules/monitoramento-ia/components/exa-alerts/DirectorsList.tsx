import { useState } from 'react';
import { DirectorCard } from './DirectorCard';
import { AddDirectorDialog } from './AddDirectorDialog';
import { Button } from '@/components/ui/button';
import { UserPlus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Director {
  id: string;
  nome: string;
  telefone: string;
  departamento: string | null;
  nivel_acesso: 'basico' | 'gerente' | 'admin';
  ativo: boolean;
  pode_usar_ia: boolean;
  user_id: string | null;
  telefone_verificado?: boolean;
  verificado_em?: string | null;
}

export const DirectorsList = () => {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);

  const loadDirectors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exa_alerts_directors')
        .select('*')
        .order('nome');

      if (error) throw error;
      setDirectors((data || []) as Director[]);
    } catch (error) {
      console.error('Error loading directors:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar diretores',
        description: 'Não foi possível carregar a lista de diretores.',
      });
    } finally {
      setLoading(false);
    }
  };

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

      toast({
        title: 'Diretor removido',
        description: 'Diretor removido com sucesso.',
      });
      
      loadDirectors();
    } catch (error) {
      console.error('Error deleting director:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover diretor',
        description: 'Não foi possível remover o diretor.',
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exa_alerts_directors')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentStatus ? 'Diretor desativado' : 'Diretor ativado',
        description: `Diretor ${currentStatus ? 'desativado' : 'ativado'} com sucesso.`,
      });
      
      loadDirectors();
    } catch (error) {
      console.error('Error toggling director status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status do diretor.',
      });
    }
  };

  const handleAddNew = () => {
    setSelectedDirector(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDirector(null);
    loadDirectors();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Diretores Cadastrados</h3>
        <div className="flex gap-2">
          <Button
            onClick={loadDirectors}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleAddNew} size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Diretor
          </Button>
        </div>
      </div>

      {directors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum diretor cadastrado ainda.</p>
          <Button onClick={handleAddNew} variant="outline" className="mt-4">
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Diretor
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {directors.map((director) => (
            <DirectorCard
              key={director.id}
              director={director}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      <AddDirectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        director={selectedDirector}
        onClose={handleDialogClose}
      />
    </div>
  );
};
