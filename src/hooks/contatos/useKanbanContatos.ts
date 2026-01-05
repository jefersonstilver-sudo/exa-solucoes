import { useMemo, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useContatos } from './useContatos';
import type { Contact, CategoriaContato, TemperaturaContato } from '@/types/contatos';

export type KanbanGroupBy = 'categoria' | 'temperatura' | 'responsavel' | 'status';

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  contacts: Contact[];
  count: number;
  totalValue: number;
}

interface UseKanbanContatosOptions {
  groupBy?: KanbanGroupBy;
  search?: string;
}

const CATEGORIA_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  lead: { title: 'Lead', color: 'text-green-700', bgColor: 'bg-green-500' },
  anunciante: { title: 'Anunciante', color: 'text-blue-700', bgColor: 'bg-blue-500' },
  sindico_exa: { title: 'Síndico EXA', color: 'text-blue-700', bgColor: 'bg-blue-600' },
  sindico_lead: { title: 'Síndico Lead', color: 'text-yellow-700', bgColor: 'bg-yellow-400' },
  parceiro_exa: { title: 'Parceiro EXA', color: 'text-amber-700', bgColor: 'bg-amber-500' },
  parceiro_lead: { title: 'Parceiro Lead', color: 'text-emerald-700', bgColor: 'bg-emerald-400' },
  prestador_elevador: { title: 'Prestador', color: 'text-orange-700', bgColor: 'bg-orange-400' },
  eletricista: { title: 'Eletricista', color: 'text-gray-700', bgColor: 'bg-gray-500' },
  provedor: { title: 'Provedor', color: 'text-purple-700', bgColor: 'bg-purple-500' },
  equipe_exa: { title: 'Equipe EXA', color: 'text-indigo-700', bgColor: 'bg-indigo-500' },
  outros: { title: 'Outros', color: 'text-gray-600', bgColor: 'bg-gray-400' },
};

const TEMPERATURA_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  frio: { title: '❄️ Frio', color: 'text-blue-700', bgColor: 'bg-blue-400' },
  morno: { title: '🔥 Morno', color: 'text-orange-700', bgColor: 'bg-orange-400' },
  quente: { title: '🌡️ Quente', color: 'text-red-700', bgColor: 'bg-red-500' },
  sem_temperatura: { title: '⚪ Sem Temp.', color: 'text-gray-600', bgColor: 'bg-gray-300' },
};

const STATUS_CONFIG: Record<string, { title: string; color: string; bgColor: string }> = {
  ativo: { title: '✅ Ativo', color: 'text-green-700', bgColor: 'bg-green-500' },
  arquivado: { title: '📦 Arquivado', color: 'text-gray-600', bgColor: 'bg-gray-400' },
  duplicado: { title: '⚠️ Duplicado', color: 'text-amber-700', bgColor: 'bg-amber-400' },
};

export const useKanbanContatos = (options: UseKanbanContatosOptions = {}) => {
  const { groupBy = 'categoria', search } = options;
  const [movingContact, setMovingContact] = useState<string | null>(null);
  
  const { contacts, loading, updateContact, refetch } = useContatos({
    search,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const columns = useMemo<KanbanColumn[]>(() => {
    if (loading) return [];

    const grouped: Record<string, Contact[]> = {};

    contacts.forEach(contact => {
      let key: string;
      
      switch (groupBy) {
        case 'temperatura':
          key = contact.temperatura || 'sem_temperatura';
          break;
        case 'responsavel':
          key = contact.responsavel_id || 'sem_responsavel';
          break;
        case 'status':
          key = contact.status || 'ativo';
          break;
        case 'categoria':
        default:
          key = contact.categoria || 'outros';
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(contact);
    });

    // Definir ordem e config baseado no groupBy
    let orderedKeys: string[];
    let config: Record<string, { title: string; color: string; bgColor: string }>;

    switch (groupBy) {
      case 'temperatura':
        orderedKeys = ['quente', 'morno', 'frio', 'sem_temperatura'];
        config = TEMPERATURA_CONFIG;
        break;
      case 'status':
        orderedKeys = ['ativo', 'arquivado', 'duplicado'];
        config = STATUS_CONFIG;
        break;
      case 'categoria':
      default:
        orderedKeys = ['lead', 'anunciante', 'sindico_exa', 'sindico_lead', 'parceiro_exa', 'parceiro_lead', 'outros'];
        config = CATEGORIA_CONFIG;
        break;
    }

    return orderedKeys
      .filter(key => grouped[key]?.length > 0 || ['lead', 'anunciante'].includes(key))
      .map(key => {
        const contactsInColumn = grouped[key] || [];
        const columnConfig = config[key] || { 
          title: key, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-400' 
        };

        return {
          id: key,
          title: columnConfig.title,
          color: columnConfig.color,
          bgColor: columnConfig.bgColor,
          contacts: contactsInColumn,
          count: contactsInColumn.length,
          totalValue: contactsInColumn.reduce((sum, c) => sum + (c.ticket_estimado || 0), 0),
        };
      });
  }, [contacts, loading, groupBy]);

  const moveContact = useCallback(async (
    contactId: string, 
    targetColumnId: string
  ) => {
    setMovingContact(contactId);
    
    try {
      const updates: Partial<Contact> = {};
      
      switch (groupBy) {
        case 'temperatura':
          if (targetColumnId === 'sem_temperatura') {
            updates.temperatura = undefined;
          } else {
            updates.temperatura = targetColumnId as TemperaturaContato;
          }
          break;
        case 'status':
          updates.status = targetColumnId as Contact['status'];
          break;
        case 'categoria':
        default:
          updates.categoria = targetColumnId as CategoriaContato;
          break;
      }

      await updateContact(contactId, updates);
      
      // Log audit
      await supabase.from('contact_audit_logs').insert({
        contact_id: contactId,
        action: 'updated',
        changed_fields: [groupBy],
        new_values: { [groupBy]: targetColumnId }
      });

      toast.success('Contato movido com sucesso', {
        action: {
          label: 'Desfazer',
          onClick: () => {
            // Implementar undo se necessário
          }
        }
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao mover contato:', error);
      toast.error('Erro ao mover contato');
    } finally {
      setMovingContact(null);
    }
  }, [groupBy, updateContact, refetch]);

  const getColumnMetrics = useCallback((columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (!column) return null;

    const urgentCount = column.contacts.filter(c => {
      const lastInteraction = c.last_interaction_at ? new Date(c.last_interaction_at) : null;
      if (!lastInteraction) return false;
      const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    }).length;

    return {
      total: column.count,
      value: column.totalValue,
      urgent: urgentCount,
    };
  }, [columns]);

  return {
    columns,
    loading,
    movingContact,
    moveContact,
    getColumnMetrics,
    refetch,
  };
};
