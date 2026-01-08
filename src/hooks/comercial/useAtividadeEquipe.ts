import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendedorAtividade {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string;
  tarefas_pendentes: number;
  propostas_ativas: number;
  ultima_atividade?: string;
  sem_atividade_hoje: boolean;
}

export const useAtividadeEquipe = () => {
  const [vendedores, setVendedores] = useState<VendedorAtividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAtividade = async () => {
    try {
      setLoading(true);
      const hoje = new Date().toISOString().split('T')[0];

      // Buscar usuários com role de vendedor ou admin
      const { data: usuarios, error: errUsuarios } = await supabase
        .from('users')
        .select('id, email, role')
        .in('role', ['admin', 'vendedor', 'super_admin'])
        .limit(20);

      if (errUsuarios) {
        throw errUsuarios;
      }

      const atividades: VendedorAtividade[] = [];

      for (const usuario of usuarios || []) {
        const nomeUsuario = usuario.email?.split('@')[0] || 'Usuário';
        
        // Contar tarefas pendentes
        const { count: tarefasPendentes } = await supabase
          .from('notion_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('responsavel', nomeUsuario)
          .not('status', 'in', '("Concluído","REALIZADO")');

        // Contar propostas ativas
        const { count: propostasAtivas } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', usuario.id)
          .in('status', ['rascunho', 'enviada', 'visualizada', 'atualizada']);

        // Verificar se tem atividade hoje (propostas criadas/atualizadas)
        const { count: atividadeHoje } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', usuario.id)
          .or(`created_at.gte.${hoje},updated_at.gte.${hoje}`);

        // Buscar última atividade (última proposta ou tarefa)
        const { data: ultimaProposta } = await supabase
          .from('proposals')
          .select('updated_at')
          .eq('created_by', usuario.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        atividades.push({
          id: usuario.id,
          nome: nomeUsuario,
          email: usuario.email || '',
          avatar_url: undefined,
          tarefas_pendentes: tarefasPendentes || 0,
          propostas_ativas: propostasAtivas || 0,
          ultima_atividade: ultimaProposta?.[0]?.updated_at || undefined,
          sem_atividade_hoje: (atividadeHoje || 0) === 0
        });
      }

      // Ordenar: sem atividade primeiro, depois por tarefas pendentes
      atividades.sort((a, b) => {
        if (a.sem_atividade_hoje && !b.sem_atividade_hoje) return -1;
        if (!a.sem_atividade_hoje && b.sem_atividade_hoje) return 1;
        return b.tarefas_pendentes - a.tarefas_pendentes;
      });

      setVendedores(atividades);

    } catch (err) {
      console.error('Erro ao buscar atividade da equipe:', err);
      setError('Erro ao carregar atividade da equipe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtividade();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchAtividade, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { vendedores, loading, error, refetch: fetchAtividade };
};
