import { useNavigate } from 'react-router-dom';
import { Plus, Users, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentCard } from '../../components/AgentCard';
import { useSupabaseAgents } from '../../hooks/useSupabaseAgents';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

export const AgentsList = () => {
  const navigate = useNavigate();
  const { agents, deleteAgent, duplicateAgent } = useSupabaseAgents();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const inactiveAgents = agents.filter(a => a.status === 'inactive').length;

  const handleDelete = (id: string) => {
    setAgentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (agentToDelete) {
      deleteAgent(agentToDelete);
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    const newAgent = await duplicateAgent(id);
    if (newAgent) {
      navigate(`/admin/monitoramento-ia/agentes/${newAgent.id}/configuracoes`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2 flex items-center gap-2">
              <Users className="w-7 h-7" />
              Agentes
            </h1>
            <p className="text-module-secondary">
              Gerencie todos os agentes de IA do sistema
            </p>
          </div>
          <Button 
            onClick={() => navigate('/admin/monitoramento-ia/agentes/novo')}
            className="bg-module-accent hover:bg-module-accent-hover"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Agente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Total de Agentes</p>
              <p className="text-3xl font-bold text-module-primary">{agents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-module-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-module-accent" />
            </div>
          </div>
        </div>

        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Agentes Ativos</p>
              <p className="text-3xl font-bold text-green-500">{activeAgents}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Circle className="w-6 h-6 text-green-500 fill-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-module-card rounded-[14px] border border-module p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-module-tertiary text-sm mb-1">Agentes Inativos</p>
              <p className="text-3xl font-bold text-module-tertiary">{inactiveAgents}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-module-muted flex items-center justify-center">
              <Circle className="w-6 h-6 text-module-tertiary fill-module-tertiary" />
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onManage={() => navigate(`/admin/monitoramento-ia/agentes/${agent.id}/configuracoes`)}
            onPreview={() => navigate(`/admin/monitoramento-ia/agentes/${agent.id}/preview`)}
            onDuplicate={() => handleDuplicate(agent.id)}
            onDelete={() => handleDelete(agent.id)}
            onRefresh={() => window.location.reload()}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
